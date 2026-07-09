## run db

npm run docker:up      # starts Postgres (needs Docker Desktop running first)
npm run db:migrate     # creates prisma/migrations/ + applies schema to "partsbench"
npm run db:seed        # populates the 5 example items
npm run db:studio      # optional: browse the seeded data at localhost:5555
npm run test           # runs tests/integration/item.test.ts against "partsbench_test"
