import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema({
    playlistName: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    videos: [{
        type: Schema.Types.ObjectId,
        ref: "Video"
    }],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    isPublic: {
        type: Boolean,
        default: true,
        required: true
    }
}, {
    timestamps: true
})

export const Playlist = mongoose.model("Playlist", playlistSchema)