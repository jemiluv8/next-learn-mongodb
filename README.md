## Next.js App Router Course - Final Using MongoDB

This is the final template for the Next.js App Router Course (using mongodb instead of vercel sql).  
It contains the final code for the dashboard application.

For more information, see the [course curriculum](https://nextjs.org/learn) on the Next.js Website.

## Motivations
I had a challenge setting up a neon-db locally for testing so I changed the final dashboard template
to use mongodb instead of vercel sql.  
I also use mongoose. And I always have a mongodb instance running locally
on startup anyways so it was more convenient to use that.  
I also find that with mongodb the list of environment variables is much smaller.
Unfortunately, the mongo query language is not as elegant as sql.

## Caveats 
- Using mongoose populate virtuals fail because all models are not loaded. So you'll see lots of pipelines
- Mongoose documents are not serializable so you'll see lots instances where I do ```JSON.parse(JSON.stringify(document))```
  to make sure data returned by mongoose query us serializable and can be passed to (Client Components)[https://github.com/vercel/next.js/discussions/46137]

## TODO
This will be my official repo for testing out fullstack nextjs apps. And that will include a couple of things like
- [ ] Support sending email with (react-email)[https://react.email/]
- [ ] Support file uploads to s3 (perhaps get a local mock for testing) - Add a means of uploading invoice pdf when creating invoices
- [ ] Explore custom session management and authentication (iron session, jwt, etc)
- [ ] Support signups
- [ ] Support for multiple user roles - The current setup is for a single user - that looks more like an admin. We could support multiple users with different roles
- [ ] Add product creation support
- [ ] Add a products list page for clients
- [ ] Support adding products to cart
- [ ] Support simple checkout with paystack
- [ ] Support login with email link with next-auth
