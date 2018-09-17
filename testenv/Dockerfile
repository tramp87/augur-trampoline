FROM ethereum/solc:0.4.20 AS solc

FROM node:10-alpine

COPY --from=solc /usr/bin/solc /usr/bin/solc

RUN mkdir /src
WORKDIR /src

RUN apk --no-cache add git bash python python-dev python3 python3-dev \
  make g++ py-pip libffi-dev \
  gmp-dev openssl-dev py-virtualenv

COPY package.json .
COPY yarn.lock .

RUN yarn install
RUN cd node_modules/augur-core && npm install npx && npm install && \
  pip install -r requirements.txt

RUN cd node_modules/augur-core && npm run-script build

COPY index.js .

EXPOSE 80

ENTRYPOINT ["node", "index.js"]
