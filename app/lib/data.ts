import { formatCurrency } from './utils';
import { Revenue } from './models/revenue';
import mongooseConnect from './mongodb/mongoose';
import { Invoice } from './models/invoices';
import { makeOneLookup } from './mongodb/utils';
import { Customer } from './models';
import { Types } from "mongoose";

await mongooseConnect();

export async function fetchRevenue() {
  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)

    // console.log('Fetching revenue data...');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const data = await Revenue.find({});

    // console.log('Data fetch completed after 3 seconds.');

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    const data = await Invoice.aggregate([
      ...makeOneLookup({
        from: "customers",
        localField: "customer_id",
        foreignField: "_id",
        as: "customer"
      }),
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $limit: 5,
      },
      {
        $addFields: {
          name: "$customer.name",
          image_url: "$customer.image_url",
          email: "$customer.email"
        }
      }
    ])
    
    const latestInvoices = data.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    const invoiceStatusPromise = Invoice.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: "$amount" }
        }
      }
    ]);
    
    const [numberOfInvoices, numberOfCustomers, invoicesByStatus] = await Promise.all([
      Invoice.countDocuments({}),
      Customer.countDocuments({}),
      invoiceStatusPromise,
    ]);
    const totalPaidInvoices = invoicesByStatus.find((invoice) => invoice._id === 'paid')?.count ?? 0;
    const totalPendingInvoices = invoicesByStatus.find((invoice) => invoice._id === 'pending')?.count ?? 0;

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const pipeline = [
        {
          $lookup: {
            from: "customers",
            localField: "customer_id",
            foreignField: "_id",
            as: "customer"
          }
        },
        {
          $unwind: {
            path: "$customer",
            preserveNullAndEmptyArrays: false
          }
        },
        {
          $match: {
            $or: [
              { "customer.name": { $regex: query, $options: "i" } },
              { "customer.email": { $regex: query, $options: "i" } },
              { amount: { $regex: query, $options: "i" } },
              { date: { $regex: query, $options: "i" } },
              { status: { $regex: query, $options: "i" } }
            ]
          }
        },
        {
          $project: {
            id: "$_id",
            amount: 1,
            date: 1,
            status: 1,
            name: "$customer.name",
            email: "$customer.email",
            image_url: "$customer.image_url"
          }
        },
        {
          $sort: { date: -1 }
        },
        {
          $skip: offset
        },
        {
          $limit: ITEMS_PER_PAGE
        }      
    ]
    const invoices = await Invoice.aggregate(pipeline as any);

    return JSON.parse(JSON.stringify(invoices)); // hack
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
  const data = await Invoice.aggregate([
    {
      $lookup: {
        from: "customers",
        let: { customerId: "$customer_id" },
        pipeline: [
          ...(query ? [{
            $match: {
              $text: {
                $search: query,
              }
            }
          }] : []),
          {
            $match: {
              $expr: { $eq: ["$_id", "$$customerId"] }
            }
          },
        ],
        as: "customer"
      }
    },
    {
      $unwind: {
        path: `$customer`,
        preserveNullAndEmptyArrays: false,
      }
    },

    {
      $count: "count",
    },
  ])

  
    const total = data && data[0] ? data[0].count : 0;

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const data = await Invoice.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      {
        $lookup: {
          from: "attachments",
          localField: "_id",
          foreignField: "record_id",
          as: "attachments"
        }
      },
      {
        $addFields: {
          amount: { $divide: ["$amount", 100] },
        }
      }
    ])

    if (data.length === 0) {
      throw new Error('Invoice not found');
    }

    return JSON.parse(JSON.stringify(data[0]));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const data = await Customer.find({});

    return JSON.parse(JSON.stringify(data));
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const aggregation = [
      ...(query ? [{
        $match: {
          $text: {
            $search: query
          }
        }
      }] : []),
      {
        $lookup: {
          from: "invoices",
          localField: "_id",
          foreignField: "customer_id",
          as: "invoices"
        }
      },
      {
        $addFields: {
          total_invoices: { $size: "$invoices" },
          total_pending: {
            $sum: {
              $map: {
                input: "$invoices",
                as: "invoice",
                in: {
                  $cond: [
                    { $eq: ["$$invoice.status", "pending"] },
                    "$$invoice.amount",
                    0
                  ]
                }
              }
            }
          },
          total_paid: {
            $sum: {
              $map: {
                input: "$invoices",
                as: "invoice",
                in: {
                  $cond: [
                    { $eq: ["$$invoice.status", "paid"] },
                    "$$invoice.amount",
                    0
                  ]
                }
              }
            }
          }
        }
      },
      {
        $project: {
          id: "$_id",
          name: 1,
          email: 1,
          image_url: 1,
          total_invoices: 1,
          total_pending: 1,
          total_paid: 1
        }
      },
      {
        $sort: { name: 1 }
      }
    ] as any;
    const data = await Customer.aggregate(aggregation)

    const customers = data.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}
