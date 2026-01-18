import mongoose from 'mongoose';
import { MONGO_USERNAME, MONGO_PASSWORD } from '$env/static/private';
import { PUBLIC_DEMO_USER } from '$env/static/public';
import { Preset } from '$lib/models/Preset';
import { User } from '$lib/models/User';
import { json, type RequestHandler } from '@sveltejs/kit';

const uri = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@darkroom-cluster.ffcj3de.mongodb.net/?appName=darkroom-cluster`;

async function connectDB() {
	if (mongoose.connection.readyState === 0) {
		await mongoose.connect(uri);
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		await connectDB();
		const body = await request.json();

		// Get userId from request body (or use PUBLIC_DEMO_USER as default)
		const userId = body.userId || PUBLIC_DEMO_USER;

		if (!userId) {
			return json({ error: 'userId is required' }, { status: 400 });
		}

		// Remove userId from body before creating preset
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { userId: _, ...presetData } = body;
		const preset = new Preset(presetData);
		await preset.save();

		// Add preset to the user requesting
		const presetId = preset._id.toString();
		const user = await User.findOneAndUpdate(
			{ username: userId },
			{ $addToSet: { presets: presetId } }, //prevents duplicates from happening
			{ new: true }
		);

		if (!user) {
			//rollback: remove preset if the user does not exist
			await Preset.deleteOne({ _id: preset._id });
			return json({ error: 'User not found (upload rolled back)' }, { status: 404 });
		}

		return json(preset, { status: 201 });
	} catch (error) {
		console.error('Error creating preset:', error);
		if (error instanceof Error && error.name === 'ValidationError') {
			return json({ error: 'Validation error', details: error.message }, { status: 400 });
		}
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
