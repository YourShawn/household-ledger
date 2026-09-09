# syntax=docker/dockerfile:1
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
COPY common/pom.xml common/pom.xml
COPY auth/pom.xml auth/pom.xml
COPY inventory/pom.xml inventory/pom.xml
COPY app/pom.xml app/pom.xml
RUN mvn -q -B -DskipTests dependency:go-offline || true
COPY . .
RUN mvn -q -B -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /src/app/target/household-ledger-app-0.1.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
