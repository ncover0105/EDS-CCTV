package com.edscorp.eds.common.config;

import java.util.HashSet;
import java.util.Set;

import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.core.MessageProducer;
import org.springframework.integration.mqtt.core.DefaultMqttPahoClientFactory;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.integration.mqtt.inbound.MqttPahoMessageDrivenChannelAdapter;
import org.springframework.integration.mqtt.support.DefaultPahoMessageConverter;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;

import com.edscorp.eds.common.util.Util;
import com.edscorp.eds.mqtt.dto.MqttMessageEvent;
import com.edscorp.eds.mqtt.model.MqttTopic;
import com.edscorp.eds.mqtt.service.MqttService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class MqttConfig {

    // private final String BROKER_URL = "tcp://localhost:1883";
    // private final String CLIENT_ID = "mqttClient";
    // private final String USERNAME = "edscorp";
    // private final String PASSWORD = "edscorp!1";
    // private final String BROKER_URL = "tcp://edscorp.iptime.org:1883";
    // private final String CLIENT_ID = "mqttClient";
    // private final String USERNAME =
    // "N1M2L3K4J5I6H7G8F9E0D1C2B3A4N5M6L7K8J9I0H1G2F3E4D5C6B7A8N9M0L1K2J3I4H5G6F7E8D9C0B1A2N3M4L5K6J7I8H9G0F1";
    // private final String PASSWORD =
    // "Yx%j$L8g*V6#R@B7mN2Q^t3&W5d@H1nL!p4cX7^r6P%F8j!K$Z2v6#G@M3^Q#R8w$L1J6z*X5y*W2d!N9r*V4q%J8";

    @Value("${mqtt.broker-url}")
    private String BROKER_URL;

    @Value("${mqtt.client-id}")
    private String CLIENT_ID;

    @Value("${mqtt.username}")
    private String USERNAME;

    @Value("${mqtt.password}")
    private String PASSWORD;

    private final ApplicationEventPublisher eventPublisher;

    private Set<String> processedMessages = new HashSet<>();

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final MqttService mqttService;

    @Bean
    public MqttPahoClientFactory mqttClientFactory() {
        var factory = new DefaultMqttPahoClientFactory();
        var options = new MqttConnectOptions();

        options.setServerURIs(new String[] { BROKER_URL });
        if (!USERNAME.isEmpty() && !PASSWORD.isEmpty()) {
            options.setUserName(USERNAME);
            options.setPassword(PASSWORD.toCharArray());
        }
        options.setAutomaticReconnect(true);
        options.setCleanSession(true);
        factory.setConnectionOptions(options);
        return factory;
    }

    // Mqtt 클라이언트를 통해 메시지를 구독하기 위한 수신채널 구성
    @Bean
    public MessageProducer inbound() {

        String[] topicNames = new String[MqttTopic.values().length];
        for (int i = 0; i < MqttTopic.values().length; i++) {
            topicNames[i] = MqttTopic.values()[i].getTopicName();
        }

        MqttPahoMessageDrivenChannelAdapter adapter = new MqttPahoMessageDrivenChannelAdapter(CLIENT_ID,
                mqttClientFactory(), topicNames);

        adapter.setCompletionTimeout(5000);
        adapter.setConverter(new DefaultPahoMessageConverter());
        adapter.setQos(1);
        adapter.setOutputChannel(mqttInputChannel());
        return adapter;
    }

    @Bean
    public MessageChannel mqttInputChannel() {
        return new DirectChannel();
    }

    @Bean
    @ServiceActivator(inputChannel = "mqttInputChannel")
    public MessageHandler handler() {
        return message -> {
            String topic = message.getHeaders().get(MqttHeaders.RECEIVED_TOPIC).toString();
            String payload = message.getPayload().toString();
            System.out.println("MqttConfig Received message: " + payload + " from topic: " + topic);
            // eventPublisher.publishEvent(new MqttMessageEvent(topic, payload)); // 메시지를
            // 클라이언트로 전달
            // JPA
            System.out.println("mqtt emergency log >>>>>>>>>>>>>>>>>>> ");
            if (topic.equals("send/emergency")) {
                try {
                    JsonNode jsonMessage = objectMapper.readTree(payload);
                    String alertCode = jsonMessage.get("alertCode").asText();
                    int boundaryNum = jsonMessage.get("boundaryNum").asInt();
                    String receptionDttm = jsonMessage.get("receptionDttm").asText();
                    String formatDttm = Util.parseReceptionDttm(receptionDttm);
                    String logData = "";
                    log.info("mqtt formatDttm : " + formatDttm);
                    // JSON에 log 필드 추가
                    if (alertCode.equals("001") || alertCode.equals("002")) {
                        logData = mqttService.getMessageBtAlertCode(alertCode);
                    } else {
                        logData = boundaryNum + "번 " + mqttService.getMessageBtAlertCode(alertCode);
                    }
                    ObjectNode updatedMessage = (ObjectNode) jsonMessage;
                    updatedMessage.put("log", logData); // log 값 추가
                    updatedMessage.put("receptionDttm", formatDttm);

                    mqttService.processMessage(topic, updatedMessage.toString());
                    eventPublisher.publishEvent(new MqttMessageEvent(topic, updatedMessage.toString()));

                } catch (Exception e) {
                    System.out.println("JPA emergency error : " + e.getMessage());
                    e.printStackTrace();
                }
            } else {
                // 기본 Topic 전달
                eventPublisher.publishEvent(new MqttMessageEvent(topic, payload)); // 메시지를 클라이언트로 전달
            }
        };
    }
}
