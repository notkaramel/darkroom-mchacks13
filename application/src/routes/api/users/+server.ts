import mongoose from 'mongoose';
import { env } from '$env/dynamic/private';
import { User } from '$lib/models/User';
import { json, type RequestHandler } from '@sveltejs/kit';

const uri = `mongodb+srv://${env.MONGO_USERNAME}:${env.MONGO_PASSWORD}@darkroom-cluster.ffcj3de.mongodb.net/darkroom?retryWrites=true&w=majority&appName=darkroom-cluster`;

async function connectDB() {
	if (mongoose.connection.readyState === 0) {
		await mongoose.connect(uri);
		console.log('MongoDB connected (users)');
	}
}

export const GET: RequestHandler = async () => {
	try {
		await connectDB();

		const users = await User.find({}).lean();

		const safeUsers = users.map((user) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { password, __v, ...safeUser } = user;
			return safeUser;
		});

		return json({ users: safeUsers }, { status: 200 });
	} catch (error) {
		console.error('GET all users error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
