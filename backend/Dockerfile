# Etapa 1: compilar con Maven
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
# El pom primero, para cachear las dependencias
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
# Tests aparte: usan Testcontainers y necesitan Docker
RUN mvn -B -q package -DskipTests

# Etapa 2: imagen liviana, solo Java para ejecutar
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
# Render free tiene 512 MB: Java usa como máximo el 75%
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]