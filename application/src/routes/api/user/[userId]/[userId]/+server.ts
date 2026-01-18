import mongoose from 'mongoose';
import { env } from '$env/dynamic/private';
import { User } from '$lib/models/User';
import { json, type RequestHandler } from '@sveltejs/kit';

const uri = `mongodb+srv://${env.MONGO_USERNAME}:${env.MONGO_PASSWORD}@darkroom-cluster.ffcj3de.mongodb.net/darkroom?retryWrites=true&w=majority&appName=darkroom-cluster`;

async function connectDB() {
	if (mongoose.connection.readyState === 0) {
		await mongoose.connect(uri);
		console.log(' MongoDB connected (users)');
	}
}


export const GET: RequestHandler = async ({ params }) => {
	try {
		await connectDB();

		const { userId } = params;
		if (!userId) {
			return json({ error: 'User ID is required' }, { status: 400 });
		}

		const user = await User.findOne({ username: userId }).lean();

		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const { password, __v, ...safeUser } = user as any;

		return json({ user: safeUser }, { status: 200 });
	} catch (error) {
		console.error('GET user error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		await connectDB();

		const { userId } = params;
		if (!userId) {
			return json({ error: 'User ID is required' }, { status: 400 });
		}

		const updates = await request.json();

		
		delete updates.password;
		delete updates._id;
		delete updates.__v;

		const user = await User.findOneAndUpdate(
			{ username: userId },
			{ $set: updates },
			{ new: true }
		).lean();

		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const { password, __v, ...safeUser } = user as any;

		return json({ user: safeUser }, { status: 200 });
	} catch (error) {
		console.error('PUT user error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
