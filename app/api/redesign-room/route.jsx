import { NextResponse } from "next/server";
import axios from "axios";
import { AiGeneratedImage, Users } from "@/config/schema";
import { db } from "@/config/db";
import { eq } from "drizzle-orm";

// 🔧 Convert image to Base64
async function ConvertImageToBase64(imageUrl) {
  try {
    const resp = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const base64ImageRaw = Buffer.from(resp.data).toString("base64");
    return base64ImageRaw;
  } catch (error) {
    console.error("❌ Error converting image to Base64:", error.message);
    throw new Error("Failed to convert image to Base64.");
  }
}

// 🔧 Get Cloudinary Config
function getCloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.error("❌ Missing Cloudinary configuration.");
    throw new Error("Cloudinary configuration is missing. Check environment variables.");
  }

  return { cloudName, uploadPreset };
}

// ☁️ Upload image to Cloudinary
async function saveImageToCloudinary(base64Image, fileName = Date.now(), quality = 80) {
  const config = getCloudinaryConfig();

  const uploadFormData = new FormData();
  uploadFormData.append("file", `data:image/png;base64,${base64Image}`);
  uploadFormData.append("upload_preset", config.uploadPreset);
  uploadFormData.append("public_id", fileName);
  uploadFormData.append("folder", "decormind");
  uploadFormData.append("quality", quality);

  try {
    console.log(`⏳ Uploading image to Cloudinary...`);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
      {
        method: "POST",
        body: uploadFormData,
      }
    );

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    console.log("✅ Cloudinary Upload Successful:", data.secure_url);
    const transformedUrl = data.secure_url.replace(
      "/upload/",
      `/upload/q_${quality},f_webp/`
    );

    return transformedUrl;
  } catch (error) {
    console.error("❌ Cloudinary Upload Failed:", error.message);
    throw new Error("Failed to upload image to Cloudinary.");
  }
}

// 🧠 Generate image using Hugging Face
async function generateImageWithHuggingFace(prompt) {
  const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;
  
  if (!HF_API_KEY) {
    throw new Error("Hugging Face API key is missing. Add HUGGING_FACE_API_KEY to your environment variables.");
  }

  const MODEL_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";

  try {
    console.log("🎨 Generating image with Hugging Face...");
    
    const response = await axios.post(
      MODEL_URL,
      {
        inputs: prompt,
        parameters: {
          negative_prompt: "ugly, blurry, poor quality, distorted, unrealistic, bad interior design",
          num_inference_steps: 30,
          guidance_scale: 7.5,
        }
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
        timeout: 60000, // 60 second timeout
      }
    );

    const base64Image = Buffer.from(response.data).toString("base64");
    console.log("✅ Image generation successful");
    
    return base64Image;
  } catch (error) {
    console.error("❌ Hugging Face API Error:", error.message);
    
    if (error.response?.status === 503) {
      throw new Error("AI model is loading. Please try again in 20 seconds.");
    }
    
    throw new Error("Failed to generate image with AI. Please try again.");
  }
}

export async function POST(req) {
  try {
    // Parse request body
    const { imageUrl, roomType, designType, additionalReq, userEmail, quality } = await req.json();

    // ✅ VALIDATION: Check required fields
    if (!imageUrl || !roomType || !designType || !userEmail) {
      return NextResponse.json(
        { error: "Missing required fields: imageUrl, roomType, designType, or userEmail." },
        { status: 400 }
      );
    }

    // ✅ VALIDATION: Double-check user credits on server side (security)
    const [user] = await db
      .select()
      .from(Users)
      .where(eq(Users.email, userEmail))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found in database." },
        { status: 404 }
      );
    }

    // This is a secondary check - credits should already be deducted on frontend
    // But we verify here for security
    if (user.credits < 0) {
      console.error("⚠️ Warning: User has negative credits!", user.email, user.credits);
      return NextResponse.json(
        { error: "Credit balance error. Please contact support." },
        { status: 403 }
      );
    }

    // 🔧 Prepare enhanced prompt
    const basePrompt = `Professional interior design photograph of a ${roomType} in ${designType} style`;
    const additionalDetails = additionalReq ? `, ${additionalReq}` : "";
    const qualityPrompt = ", high quality, 4k, professional photography, well-lit, detailed, modern";
    
    const fullPrompt = basePrompt + additionalDetails + qualityPrompt;

    console.log("📤 Generating image with prompt:", fullPrompt);

    // 🧠 Generate image using Hugging Face
    const generatedImageBase64 = await generateImageWithHuggingFace(fullPrompt);

    // Upload generated image to Cloudinary
    const uploadedImageUrl = await saveImageToCloudinary(
      generatedImageBase64, 
      `redesign_${Date.now()}`, 
      quality || 80
    );

    if (!uploadedImageUrl) {
      throw new Error("Image upload to Cloudinary failed.");
    }

    // 💾 Save to Database
    const dbResult = await db
      .insert(AiGeneratedImage)
      .values({
        roomType,
        designType,
        orgImage: imageUrl,
        aiImage: uploadedImageUrl,
        userEmail,
      })
      .returning({ id: AiGeneratedImage.id });

    console.log("✅ Database Insert Successful:", dbResult);

    // Return result
    return NextResponse.json({ 
      result: uploadedImageUrl,
      message: "Design generated successfully!",
      creditsRemaining: user.credits
    });
    
  } catch (e) {
    console.error("❌ Error in redesign-room API:", e.message);
    return NextResponse.json({ 
      error: e.message || "Internal Server Error" 
    }, { status: 500 });
  }
}