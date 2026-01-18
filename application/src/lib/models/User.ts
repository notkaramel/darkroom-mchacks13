import mongoose, { Schema, model } from 'mongoose';

export interface IUser {
	username: string;
	photos: string[];
	presets: string[];
}

const userSchema = new Schema<IUser>(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			index: true
		},
		photos: {
			type: [String],
			default: []
		},
		presets: {
			type: [String],
			default: []
		}
	},
	{
		timestamps: true
	}
);

export const User = mongoose.models.User || model<IUser>('User', userSchema);
