FROM eclipse-temurin:21-jdk
ADD https://github.com/JetBrains/kotlin/releases/download/v2.4.20/kotlin-compiler-2.4.20.zip /opt/kotlin.zip
RUN cd /opt && jar xf kotlin.zip && rm kotlin.zip && chmod +x /opt/kotlinc/bin/*
ENV PATH=/opt/kotlinc/bin:$PATH
