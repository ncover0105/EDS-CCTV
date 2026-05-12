package com.edscorp.eds.common.config;

import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.core.MessageProducer;
import org.springframework.integration.mqtt.core.DefaultMqttPahoClientFactory;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.integration.mqtt.inbound.MqttPahoMessageDrivenChannelAdapter;
import org.springframework.integration.mqtt.support.DefaultPahoMessageConverter;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;

import com.edscorp.eds.mqtt.model.MqttTopic;
import com.edscorp.eds.mqtt.service.MqttCctvMessageService;

import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
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

    private final MqttCctvMessageService mqttCctvMessageService;

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
            mqttCctvMessageService.handle(topic, payload);
        };
    }
}
