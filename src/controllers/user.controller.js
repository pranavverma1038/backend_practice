import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = User.generateAccessToken()
        const refreshToken = User.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating refresh and access token")
    }
}

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
       throw new ApiError(400, "ALl Fields Are Required")
    }

    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409, "User already exists")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    let coverImageLocalPath 
    if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
        coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    }


    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar File is Required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    let coverImage = null;
    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
    }

    
    if(!avatar){
        throw new ApiError(400,"Avatar File is Required")
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
        throw new ApiError(400, "something went wrong while registering the user")
    }


    return res.status(201).json(
        new ApiResponse(200, userCreated, "User Registered Successfully")
    )

})

 const loginUser = asyncHandler(async(req,res)=>{
    //req body -> data
    //username or eamil
    //find the user
    //password
    //access and refresh token
    //send cookie
    const {email,username,password} = req.body
    if(!username || !password){
        throw new ApiError(400, "username or password required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(400, "user does not exist")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if(!isPasswordCorrect){
        throw new ApiError(401,"Invalid Credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly : true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken,options)
    .json(
        new ApiResponse(
            200,{
                user:loggedInUser,accessToken,
                refreshToken
            },
            "User logged In Successfully"
        )
    )



 })

 const logoutUser = asyncHandler(async(req,res)=>{
    await User.findOneAndUpdate(
        req.user._id,{
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly : true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(20,{},"User logged Out Successfully"))
 })


export {registerUser,loginUser,logoutUser}