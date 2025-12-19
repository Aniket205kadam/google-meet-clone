FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21

WORKDIR /app

COPY --from=build /app/target/namaskar.jar .

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/namaskar-backend.jar"]