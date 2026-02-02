import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Database URL for NeonDB
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_yzWhr73RYIsw@ep-soft-violet-a13wc3hb-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=verify-full";

// Create the adapter
const adapter = new PrismaPg({
  connectionString: DATABASE_URL,
});

// Create Prisma client singleton
const prismaClientSingleton = () => {
  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
