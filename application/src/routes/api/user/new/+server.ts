import mongoose from 'mongoose';
import { MONGO_USERNAME, MONGO_PASSWORD } from '$env/static/private';
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

		if (!body.username) {
			return json({ error: 'Username is required' }, { status: 400 });
		}

		const user = new User({ username: body.username });
		await user.save();

		const { __v, ...safeUser } = user.toObject();

		return json({ user: safeUser }, { status: 201 });
	} catch (error) {
		console.error('Error creating user:', error);
		if (error instanceof Error && error.name === 'ValidationError') {
			return json({ error: 'Validation error', details: error.message }, { status: 400 });
		}
		if (error instanceof Error && error.code === 11000) {
			return json({ error: 'Username already exists' }, { status: 409 });
		}
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
