FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY target/cyclesguard-ingestion-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "-Djava.security.egd=file:/dev/./urandom", "app.jar"]
