FROM eclipse-temurin:22-alpine AS base

FROM base as builder

RUN apk update && apk add --no-cache nodejs npm

WORKDIR /server

COPY server/scripts/package.json server/scripts/package-lock.json ./scripts/
RUN cd ./scripts && npm install

COPY server/gradlew server/settings.gradle ./
COPY server/gradle ./gradle

RUN chmod +x gradlew
RUN ./gradlew wrapper --gradle-version latest

COPY server .
RUN ./gradlew installDist

FROM base as runner

WORKDIR /server

COPY --from=builder server/scripts ./scripts
COPY shared /shared
COPY --from=builder /server/build/install/boilerclasses ./boilerclasses
COPY server/application.prod.conf application.conf

CMD ./boilerclasses/bin/boilerclasses