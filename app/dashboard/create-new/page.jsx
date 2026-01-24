// "use client";

// import React, { useState, useEffect, useCallback, useContext } from "react";
// import ImageSelection from "./_components/ImageSelection";
// import RoomType from "./_components/RoomType";
// import DesignType from "./_components/DesignType";
// import AdditionalReq from "./_components/AdditionalReq";
// import { Button } from "@/components/ui/button";
// import axios from "axios";
// import { useAuth, useUser } from "@clerk/nextjs";
// import { addListener } from "process";
// import CustomLoading from "./_components/CustomLoading";
// import AiOutputDialog from "../_components/AiOutputDialog";
// import { db } from "@/config/db";
// import { Users } from "@/config/schema";
// import { UserDetailContext } from "@/app/_context/UserDetailContext";
// import Link from "next/link";
// import { Home } from "lucide-react";

// function CreateNew() {
//   const { user } = useUser();
//   const [formData, setFormData] = useState({});
//   const [uploadedImageUrl, setUploadedImageUrl] = useState("");
//   const [aiGeneratedImageUrl, setAiGeneratedImageUrl] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [errorMessage, setErrorMessage] = useState("");
//   // const [outputResult, setOutputResult]= useState();
//   const [aiOutputImage, setAiOutputImage] = useState();
//   const [openOutputDialog, setOpenOutputDialog] = useState(false);
//   const [orgImage, setOrgImage] = useState();

//   const { userDetail, setUserDetail } = useContext(UserDetailContext);

//   const onHandleInputChange = useCallback((value, fieldName) => {
//     setFormData((prev) => ({ ...prev, [fieldName]: value || "" }));
//   }, []);

//   useEffect(() => {
//     if (Object.keys(formData).length > 0) {
//       console.log("Updated FormData:", formData);
//     }
//   }, [formData]);

//   const getCloudinaryConfig = () => {
//     const cloudName = process.env.NEXT_PUBLIC_CLOUD_NAME;
//     const uploadPreset = process.env.NEXT_PUBLIC_UPLOAD_PRESET;

//     if (!cloudName || !uploadPreset) {
//       setErrorMessage("Cloudinary configuration missing.");
//       console.error("❌ Cloudinary env variables are not set.");
//       return null;
//     }

//     return { cloudName, uploadPreset };
//   };

//   const saveImageToCloudinary = async () => {
//     if (!formData.image) {
//       setErrorMessage("⚠️ Please select an image.");
//       return null;
//     }

//     const config = getCloudinaryConfig();
//     if (!config) return null;

//     const uploadFormData = new FormData();
//     uploadFormData.append("file", formData.image);
//     uploadFormData.append("upload_preset", config.uploadPreset);

//     try {
//       setLoading(true);
//       console.log("⏳ Uploading image to Cloudinary...");

//       const response = await fetch(
//         `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
//         {
//           method: "POST",
//           body: uploadFormData,
//         }
//       );

//       const data = await response.json();
//       if (data.error) throw new Error(data.error.message);

//       console.log("✅ Cloudinary Upload Successful:", data.secure_url);
//       setOrgImage(data.secure_url);
//       return data.secure_url;
//     } catch (error) {
//       console.error("❌ Cloudinary Upload Failed:", error);
//       setErrorMessage("⚠️ Cloudinary upload failed. Try again.");
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   };
//   const generateAiImage = async () => {
//     setLoading(true);
//     const rawImageUrl = await saveImageToCloudinary();
//     const result = await axios.post(
//       "/api/redesign-room",
//       {
//         imageUrl: rawImageUrl,
//         roomType: formData?.roomType,
//         designType: formData?.designType,
//         additionalReq: formData?.additionalReq,
//         userEmail: user?.primaryEmailAddress?.emailAddress
//       });
//     console.log(result.data);
//     await updateUserCredits();
//     setAiOutputImage(result.data.result);
//     setOpenOutputDialog(true);
//     await updateUserCredits();
//     setLoading(false);




//   }
//   const updateUserCredits = async () => {
//     const result = await db.update(Users).set({
//       credits: userDetail?.credits - 1

//     }).returning({ id: Users.id });

//     if (result) {
//       setUserDetail(prev => ({
//         ...prev,
//         credits: userDetail?.credits - 1

//       }))
//       return result[0].id
//     }

//   }
//   // const { getToken } = useAuth();

//   // const generateAiImage = async () => {
//   //   // if (loading) return;

//   //   // setErrorMessage("");
//   //   // const rawImageUrl = await saveImageToCloudinary();
//   //   // if (!rawImageUrl) return;

//   //   // setUploadedImageUrl(rawImageUrl);

//   //   // try {
//   //   //   setLoading(true);
//   //   //   console.log("🚀 Fetching authentication token...");

//   //   //   const token = await getToken();
//   //   //   console.log("🆔 Token received in frontend:", token); // Debugging

//   //   //   if (!token) {
//   //   //     setErrorMessage("⚠️ Authentication failed! Please log in.");
//   //   //     return;
//   //   //   }

//   //   //   console.log("🚀 Sending request to AI model...");

//   //     const response = await axios.post(
//   //       "/api/redesign-room",formData);
//   //       console.log(result);
//   //       // {
//   //       //   ...formData,
//   //       //   imageUrl: rawImageUrl,
//   //       // },
//   //       // {
//   //       //   headers: {
//   //       //     Authorization: `Bearer ${token}`, // Attach the token
//   //       //     "Content-Type": "application/json",
//   //       //   },
//   //       //   withCredentials: true,
//   //       // }
//   //     );

//   //     console.log("✅ AI Response:", response.data);

//   //     if (response.data.generatedImageUrl) {
//   //       setAiGeneratedImageUrl(response.data.generatedImageUrl);
//   //     } else {
//   //       throw new Error("⚠️ AI did not return an image. Try again.");
//   //     }
//   //   } catch (error) {
//   //     console.error("❌ AI Generation Error:", error);
//   //     console.log("🔴 Response Data:", error.response?.data); // Debugging
//   //     setErrorMessage(error.response?.data?.error || "⚠️ AI generation failed. Try again.");
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   return (
//     <>
//       <div className="px-4">
//         {/* Navigation buttons */}
//         <div className="flex justify-between items-center mb-6 px-2">
//           <Link href="/dashboard">
//             <Button variant="outline" className="flex items-center gap-2 px-5 py-3 text-base sm:text-lg ">
//               <Home className="w-20 h-20" />
//               Dashboard
//             </Button>
//           </Link>
//           <Link href="/">
//             <Button variant="secondary" className="flex items-center gap-2 px-5 py-3 text-base sm:text-lg">
//               <Home className="w-20 h-2" />
//               Home
//             </Button>
//           </Link>
//         </div>
//         <h2 className="font-bold text-2xl text-primary text-center mb-4">
//           Experience the Magic of AI Remodeling
//         </h2>
//         <p className="text-center text-lg mb-6" style={{ color: "#8B4513" }}>
//           Transform any room with a click. Select a space, choose a style, and watch as AI reimagines your environment.
//         </p>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-4 ml-[15px]">
//           <ImageSelection selectedImage={(value) => onHandleInputChange(value, "image")} />
//           <div className="mt-4">
//             <RoomType selectedRoomType={(value) => onHandleInputChange(value, "roomType")} />
//             <DesignType selectedDesignType={(value) => onHandleInputChange(value, "designType")} />
//             <AdditionalReq additionalRequirementInput={(value) => onHandleInputChange(value, "additionalReq")} />

//             <Button className="w-full mt-5" onClick={generateAiImage} disabled={loading}>
//               {loading ? "Processing..." : "Generate"}
//             </Button>
//           </div>
//         </div>

//         {uploadedImageUrl && <img src={uploadedImageUrl} alt="Uploaded" className="mt-4 rounded shadow-lg" />}
//         {aiGeneratedImageUrl && <img src={aiGeneratedImageUrl} alt="AI Generated" className="mt-4 rounded shadow-lg" />}
//         {errorMessage && <div className="text-red-500 mt-4">{errorMessage}</div>}
//       </div>

//       <div>
//         <CustomLoading loading={loading} />
//         <AiOutputDialog openDialog={openOutputDialog}
//           closeDialog={() => setOpenOutputDialog(false)}
//           orgImage={orgImage}
//           aiImage={aiOutputImage}
//         />
//       </div>


//     </>
//   );

// }

// export default CreateNew;


"use client";

import React, { useState, useEffect, useCallback, useContext } from "react";
import ImageSelection from "./_components/ImageSelection";
import RoomType from "./_components/RoomType";
import DesignType from "./_components/DesignType";
import AdditionalReq from "./_components/AdditionalReq";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import CustomLoading from "./_components/CustomLoading";
import AiOutputDialog from "../_components/AiOutputDialog";
import { db } from "@/config/db";
import { Users } from "@/config/schema";
import { UserDetailContext } from "@/app/_context/UserDetailContext";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Home, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

function CreateNew() {
  const { user } = useUser();
  const router = useRouter();
  
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [aiOutputImage, setAiOutputImage] = useState();
  const [openOutputDialog, setOpenOutputDialog] = useState(false);
  const [orgImage, setOrgImage] = useState();

  const { userDetail, setUserDetail } = useContext(UserDetailContext);

  const onHandleInputChange = useCallback((value, fieldName) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value || "" }));
  }, []);

  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      console.log("Updated FormData:", formData);
    }
  }, [formData]);

  const getCloudinaryConfig = () => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setErrorMessage("Cloudinary configuration missing.");
      console.error("❌ Cloudinary env variables are not set.");
      return null;
    }

    return { cloudName, uploadPreset };
  };

  const saveImageToCloudinary = async () => {
    if (!formData.image) {
      setErrorMessage("⚠️ Please select an image.");
      return null;
    }

    const config = getCloudinaryConfig();
    if (!config) return null;

    const uploadFormData = new FormData();
    uploadFormData.append("file", formData.image);
    uploadFormData.append("upload_preset", config.uploadPreset);

    try {
      console.log("⏳ Uploading image to Cloudinary...");

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
      setOrgImage(data.secure_url);
      return data.secure_url;
    } catch (error) {
      console.error("❌ Cloudinary Upload Failed:", error);
      setErrorMessage("⚠️ Cloudinary upload failed. Try again.");
      return null;
    }
  };

  const generateAiImage = async () => {
    setErrorMessage("");

    // ✅ STEP 1: Check if user has enough credits FIRST
    const currentCredits = parseInt(userDetail?.credits) || 0;
    
    if (currentCredits < 1) {
      setErrorMessage("❌ Insufficient credits! Redirecting to buy credits...");
      setTimeout(() => {
        router.push("/buy-credits");
      }, 2000);
      return;
    }

    // ✅ STEP 2: Validate all required fields
    if (!formData.image || !formData.roomType || !formData.designType) {
      setErrorMessage("⚠️ Please fill in all required fields (Image, Room Type, and Design Type)");
      return;
    }

    setLoading(true);

    try {
      // ✅ STEP 3: Deduct credit BEFORE API call
      const newCreditBalance = currentCredits - 1;
      
      console.log(`💳 Deducting 1 credit. Current: ${currentCredits} → New: ${newCreditBalance}`);
      
      await db
        .update(Users)
        .set({ credits: newCreditBalance })
        .where(eq(Users.email, user?.primaryEmailAddress?.emailAddress));

      // Update local state immediately
      setUserDetail((prev) => ({
        ...prev,
        credits: newCreditBalance,
      }));

      console.log("✅ Credit deducted successfully");

      // ✅ STEP 4: Upload image to Cloudinary
      const rawImageUrl = await saveImageToCloudinary();
      if (!rawImageUrl) {
        throw new Error("Failed to upload image");
      }

      // ✅ STEP 5: Call AI generation API
      console.log("🎨 Calling AI generation API...");
      const result = await axios.post("/api/redesign-room", {
        imageUrl: rawImageUrl,
        roomType: formData?.roomType,
        designType: formData?.designType,
        additionalReq: formData?.additionalReq,
        userEmail: user?.primaryEmailAddress?.emailAddress,
      });

      console.log("✅ AI generation successful:", result.data);

      // ✅ STEP 6: Show result
      setAiOutputImage(result.data.result);
      setOpenOutputDialog(true);
      
    } catch (error) {
      console.error("❌ Error during generation:", error);
      setErrorMessage(
        error.response?.data?.error || 
        error.message || 
        "⚠️ AI generation failed. Please try again."
      );

      // ✅ REFUND CREDIT on failure
      console.log("⚠️ Refunding credit due to error...");
      try {
        const refundedCredits = currentCredits; // Restore original credits
        
        await db
          .update(Users)
          .set({ credits: refundedCredits })
          .where(eq(Users.email, user?.primaryEmailAddress?.emailAddress));

        setUserDetail((prev) => ({
          ...prev,
          credits: refundedCredits,
        }));

        console.log("✅ Credit refunded successfully");
        alert("❌ Generation failed. Your credit has been refunded.");
      } catch (refundError) {
        console.error("❌ Failed to refund credit:", refundError);
        alert("❌ Generation failed. Please contact support for credit refund.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="px-4">
        {/* Navigation buttons */}
        <div className="flex justify-between items-center mb-6 px-2">
          <Link href="/dashboard">
            <Button variant="outline" className="flex items-center gap-2 px-5 py-3 text-base sm:text-lg">
              <Home className="w-5 h-5" />
              Dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button variant="secondary" className="flex items-center gap-2 px-5 py-3 text-base sm:text-lg">
              <Home className="w-5 h-5" />
              Home
            </Button>
          </Link>
        </div>

        <h2 className="font-bold text-2xl text-primary text-center mb-4">
          Experience the Magic of AI Remodeling
        </h2>
        <p className="text-center text-lg mb-6" style={{ color: "#8B4513" }}>
          Transform any room with a click. Select a space, choose a style, and watch as AI reimagines your environment.
        </p>

        {/* Credit Warning */}
        {userDetail?.credits < 1 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3 max-w-2xl mx-auto">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-yellow-800">
              You have <strong>{userDetail?.credits || 0}</strong> credits remaining. 
              <a href="/buy-credits" className="font-bold underline ml-1">Buy more credits</a> to continue.
            </p>
          </div>
        )}

        {/* Success: Show current balance */}
        {userDetail?.credits >= 1 && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-green-800 text-center">
              ✨ You have <strong>{userDetail?.credits}</strong> credits available
            </p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 max-w-2xl mx-auto">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-800">{errorMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-4 ml-[15px]">
          <ImageSelection selectedImage={(value) => onHandleInputChange(value, "image")} />
          <div className="mt-4">
            <RoomType selectedRoomType={(value) => onHandleInputChange(value, "roomType")} />
            <DesignType selectedDesignType={(value) => onHandleInputChange(value, "designType")} />
            <AdditionalReq additionalRequirementInput={(value) => onHandleInputChange(value, "additionalReq")} />

            <Button 
              className="w-full mt-5" 
              onClick={generateAiImage} 
              disabled={loading || !userDetail?.credits || userDetail?.credits < 1}
            >
              {loading ? "Processing..." : "Generate (1 Credit)"}
            </Button>
            
            {/* Credit Info */}
            <p className="text-center text-sm text-gray-500 mt-3 mb-5">
              Current Balance: <span className="font-bold text-[#6a452e]">{userDetail?.credits || 0}</span> credits
            </p>
          </div>
        </div>
      </div>

      <div>
        <CustomLoading loading={loading} />
        <AiOutputDialog 
          openDialog={openOutputDialog}
          closeDialog={() => setOpenOutputDialog(false)}
          orgImage={orgImage}
          aiImage={aiOutputImage}
        />
      </div>
    </>
  );
}

export default CreateNew;