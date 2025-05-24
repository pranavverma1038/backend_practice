import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler( async(req,res)=>{
    //get user deatils from frontend
    //validation for email password not empty
    //check if user already exist username eamil
    //upload them to cloudinary,avatar and check if uploaded
    //create user object - create entry in db
    //remove password and refresh token from rsponse
    //check for user creation 
    //return response 
    const{fullname,email,username,password} = req.body
    console.log("email",email)

    if([fullname, email, username, password].some((field)=> field?.trim()==="")
    ){
       throw new apiError(400, "ALl Fields Are Required")
    }

    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser){
        throw new apiError(409, "User already exists")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;


    if(!avatarLocalPath){
        throw new apiError(400, "Avatar File is Required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    
    if(!avatar){
        throw new apiError(400,"Avatar File is Required")
    }

    const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!userCreated){
        throw new apiError(400, "something went wrong while registering the user")
    }


    return res.status(201).json(
        new ApiResponse(200, userCreated, "User Registered Successfully")
    )

})


export {registerUser}