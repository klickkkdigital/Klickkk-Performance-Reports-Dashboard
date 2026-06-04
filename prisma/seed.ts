import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

async function main() {
  // Create super admin
  const adminHash = await bcrypt.hash('Ducati@panigale4', 12)
  await db.user.upsert({
    where: { email: 'admin@klickkk.com' },
    create: {
      email: 'admin@klickkk.com',
      name: 'Klickkk Admin',
      passwordHash: adminHash,
      role: 'SUPER_ADMIN',
    },
    update: { passwordHash: adminHash },
  })

  console.log('✓ Seeded: admin@klickkk.com / Ducati@panigale4')
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
