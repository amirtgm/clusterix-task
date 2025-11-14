## About the project 

This project uses Nestjs, Redis, Postgres, Prisma, React, vite, nginx, better-auth, react-query, Shadcn, TailwindCSS, Biome, BullMq.

## Setup Instructions
1. Clone the repository.
2. setup enviroments using `npm run setup:env`.
   1. This will copy the example environment file to the actual .env file needed for docker.
   2. there are api keys for the third party news sources (as they are development purposes) for the sake of easier running the project but you can replace them with your own if needed. `apps/api/.env.prod` file.
3. Run docker compose to start all the services. You can use `npm run setup:docker` or `docker compose up --build -d` to build and start the services in detached mode. 
4. after starting go to `localhost:8080` to see the dashboard and create your user.

## Docker
all of the configurations for all the services are available in the docker. 
having database and redis on docker is not a good practice but here to run everything easily we have them on docker as well. migrations will happen as you build and run the docker and they forward only but in order to achieve the production ready state they should be handled with proper CI/CD pipelines and strategies.
enviroments are already setup to work with docker services but for production we need to make sure that the pipelines will inject the secrets and also we can use secret management tools as well.
for speeding up the image build process both api and web are using bun as the package manager. 
the frontend docker uses nginx to serve.

## Linting and Formatting
i'm using biome as the linter and formatter. you can run `npm run lint` to check for linting issues and `npm run format` to format the codebase. also there are commands to lint only the changed files or the staged files before committing.

## what would i do differently in a real production ready project?
probably would choose elysia with bun over nestjs with nodejs. for smaller projects. 
would setup the end to end typesafety using tools like tRPC or sharing the types with openapi generator.
much more sophisticated logging and monitoring strategy. also more advanced database performance optimizations using indexes and caching strategies.
using redis to cache as well. 
probably adding tsvector for postgre to get the better search happening on the database side.

## how backend works?
the backend is using nestjs with dependency injections.
i choosed better-auth for authentication as it is simple to setup and works well with nestjs and also we can switch to jwt structure pretty easily if needed and it supports the client variations as well with huge community support it's a good choice for authentication.

there are 2 main modules the import-news module and the news module.
the import news using bullmq with redis broker to run background jobs to fetch news from the third party sources. 
and the layout is that we can easily add new adapters and they all run without any race conditions. 
as you start the project if there are no article in database, it will try to run it to backfill the data a little. but after that it will run every hour to fetch new articles based on the latest fetch for each source. 
and for news module we are using prisma to query the database and return the articles.

## how frontend works?
the frontend is using react with react-router for routing and react-query for data fetching and caching.
for authentication better-auth is used with session strategy and the session is stored in httpOnly cookies.
shadcn/ui is used for the components and tailwindcss for styling.



## what would i do differently if i had more time?
i spent most of the time working on the backend and making it work properly with a lot of testings and structures. also spent some time on the structure of the project and setting up all of the tools and docker we needed. so i would choose a boilerplate to start on with modern tools like elysia, bun, tRPC, prisma etc.
and for the frontend i would spend more time on the design and making the ui a little better but mainly on the component side and how the app is aligned with queries and filters. also can add the SSR.
using suspense and react router layouts more effectively.


## why Nestjs if i would use another framework?
i'm very familiar with nestjs and it's the go to framework for building long lasting fully typed with separation of concerns for backend applications with nodejs and the commiunity is still trying to adapt to the new solutions. 