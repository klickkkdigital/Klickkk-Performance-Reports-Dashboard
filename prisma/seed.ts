import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

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

  // Create a demo client
  const client = await db.client.upsert({
    where: { slug: 'demo-client' },
    create: {
      name: 'Demo Client',
      slug: 'demo-client',
      primaryColor: '#6366f1',
      industry: 'E-commerce',
    },
    update: {},
  })

  const clientHash = await bcrypt.hash('client123!', 12)
  await db.user.upsert({
    where: { email: 'demo@client.com' },
    create: {
      clientId: client.id,
      email: 'demo@client.com',
      name: 'Demo User',
      passwordHash: clientHash,
      role: 'CLIENT_VIEWER',
    },
    update: {},
  })

  console.log('✓ Seeded: admin@klickkk.com / Ducati@panigale4')
  console.log('✓ Seeded: demo@client.com / client123!')
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
