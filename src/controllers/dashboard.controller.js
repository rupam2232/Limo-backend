import mongoose, { isValidObjectId, mongo } from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    if (!isValidObjectId(req.user._id)) throw new ApiError(400, "Not a valid objectId")

    const totalVideoStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        }, {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "videoLikes"
            }
        }, {
            $addFields: {
                totalVideoLikes: { $size: "$videoLikes" }
            }
        }, {
            $group: {
                _id: null,
                totalVideoViews: { $sum: "$views" },
                totalVideos: { $sum: 1 },
                totalVideoLikes: { $sum: "$totalVideoLikes" }
            }
        }, {
            $project: {
                _id: 0,
                totalVideoViews: 1,
                totalVideos: 1,
                totalVideoLikes: 1
            }
        }
    ])

    const totalSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(req.user?._id)
            }
        }, {
            $group: {
                _id: null,
                totalSubscribers: { $sum: 1 }
            }
        }, {
            $project: {
                _id: 0,
                totalSubscribers: 1
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200,
        {
            totalVideoViews: totalVideoStats[0]?.totalVideoViews ? totalVideoStats[0].totalVideoViews : 0,
            totalSubscribers: totalSubscribers[0] ? totalSubscribers[0].totalSubscribers : 0,
            totalVideos: totalVideoStats[0]?.totalVideos ? totalVideoStats[0].totalVideos : 0,
            totalVideoLikes: totalVideoStats[0]?.totalVideoLikes ? totalVideoStats[0].totalVideoLikes : 0
        },
        "totalvideoviews"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { page = 1, limit = 10, sortBy = 'createdAt', sortType = 'desc' } = req.query
    if (!isValidObjectId(req.user?._id)) throw new ApiError(400, "not a valid user id")

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    if (pageNumber < 1 || limitNumber < 1) {
        return res
            .status(400)
            .json(new ApiResponse(400, 'Page and limit must be positive integers'));
    }

    const skip = (pageNumber - 1) * limitNumber;

    const totalContent = await Video.countDocuments({owner: new mongoose.Types.ObjectId(req.user?._id)})

    const allVideos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        }, {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        }, {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments"
            }
        }, {
            $addFields: {
                likes: { $size: { $ifNull: ["$likes", []] } },
                comments: { $size: { $ifNull: ["$comments", []] } }
            }
        }, {
            $sort: { [sortBy]: sortType === 'asc' ? 1 : -1 },
        }, {
            $skip: skip,
        }, {
            $limit: limitNumber,
        }, {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                tags: 1,
                thumbnail: 1,
                views: 1,
                duration: 1,
                isPublished: 1,
                likes: 1,
                comments: 1,
                createdAt: 1
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200,
        {
            videos: allVideos,
            currentPage: pageNumber,
            totalPages: Math.ceil((totalContent) / limitNumber)
        }, "All uploaded videos"))
})

export {
    getChannelStats,
    getChannelVideos
}