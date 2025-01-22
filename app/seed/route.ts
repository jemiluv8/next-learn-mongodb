import bcrypt from 'bcrypt';

import mongoose from "mongoose";
import mongooseConnect from '../lib/mongodb/mongoose';

import { User } from '../lib/models/users';
import { Revenue } from "../lib/models/revenue";
import { Invoice } from '../lib/models/invoices';
import { Customer } from '../lib/models/customers';
import { customers, invoices, revenue, users } from "../lib/placeholder-data";

await mongooseConnect();

async function seedUsers(session: mongoose.ClientSession) {
  const insertedUsers = await Promise.all(
    users.map(async (user) => await new User({ ...user, password: await bcrypt.hash(user.password, 10)}).save({ session })),
  );

  return insertedUsers;
}

  async function seedInvoices(session: mongoose.ClientSession) {
    const invoicesCreated = await Promise.all(
      invoices.map(
        (data) => new Invoice(data).save({ session }
      ),
    ))
  
    return invoicesCreated;
  }

async function seedCustomers(session: mongoose.ClientSession) {
  const insertedCustomers = await Promise.all(
    customers.map(
      (customer) => new Customer(customer).save({ session }
    ),
  ))

  return insertedCustomers;
}

async function seedRevenue(session: mongoose.ClientSession) {
  const insertedRevenue = await Promise.all(
    revenue.map((data) => new Revenue(data).save({ session })),
  );

  return insertedRevenue;
}

export async function GET() {
  return Response.json({
    message:
      'Uncomment this file and remove this line. You can delete this file when you are finished.',
  });
  // seed() run this
}

async function seed() {
  const session = await mongoose.startSession();
  try {
    session.startTransaction()
    await seedUsers(session);
    await seedCustomers(session);
    await seedInvoices(session);
    await seedRevenue(session);

    await session.commitTransaction();
    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    await session.abortTransaction();
    return Response.json({ error }, { status: 500 });
  }
}
