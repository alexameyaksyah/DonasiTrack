import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error("Missing DATABASE_URL in environment variables");
}

let prisma: PrismaClient;
if (connectionString.startsWith("file:")) {
	// SQLite - provide datasource URL explicitly to PrismaClient
	prisma = new PrismaClient({ datasources: { db: { url: connectionString } } });
} else {
	// Assume PostgreSQL - use pg adapter
	const adapter = new PrismaPg({ connectionString });
	prisma = new PrismaClient({ adapter });
}

export { prisma };
