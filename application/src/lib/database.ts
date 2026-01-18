import mongoose from 'mongoose';
import { MONGO_USERNAME, MONGO_PASSWORD } from '$env/static/private';

const user = encodeURIComponent(MONGO_USERNAME);
const pass = encodeURIComponent(MONGO_PASSWORD);

const uri = `mongodb+srv://${user}:${pass}@darkroom-cluster.ffcj3de.mongodb.net/darkroom?retryWrites=true&w=majority`;

let cached = (globalThis as any)._mongoose;
if (!cached) {
	cached = (globalThis as any)._mongoose = { conn: null, promise: null };
}

export async function connectDB() {
	if (cached.conn) return cached.conn;

	if (!cached.promise) {
		console.log('MONGO URI (masked) =', uri.replace(/:\/\/.*?:.*?@/, '://***:***@'));
		cached.promise = mongoose.connect(uri).then((m) => m);
	}

	cached.conn = await cached.promise;
	return cached.conn;
}
