import * as amqplib from 'amqplib';

// RabbitMQ connection configuration
const RABBITMQ_CONFIG = {
  hostname: process.env.RABBITMQ_HOST || 'localhost',
  port: parseInt(process.env.RABBITMQ_PORT || '5672'),
  username: process.env.RABBITMQ_USERNAME || 'user',
  password: process.env.RABBITMQ_PASSWORD || 'password',
};

class RabbitMQService {
  private connection: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;

  constructor() {
    this.getConnection = this.getConnection.bind(this);
    this.getChannel = this.getChannel.bind(this);
    this.createQueue = this.createQueue.bind(this);
    this.createWorker = this.createWorker.bind(this);
    
    // Initialize connection when service is created
    this.initializeConnection().catch(err => {
      console.error('Failed to initialize RabbitMQ connection:', err);
    });
  }

  private async initializeConnection(): Promise<void> {
    try {
      this.connection = await amqplib.connect(RABBITMQ_CONFIG);
      
      // Handle connection events
      this.connection.on('error', (err: Error) => {
        console.error('RabbitMQ connection error:', err);
        this.connection = null;
        // Try to reconnect after a delay
        setTimeout(() => this.initializeConnection(), 5000);
      });
      
      this.connection.on('close', () => {
        console.log('RabbitMQ connection closed');
        this.connection = null;
        // Try to reconnect after a delay
        setTimeout(() => this.initializeConnection(), 5000);
      });
      
      // Initialize a channel right away
      this.channel = await this.connection.createChannel();
      
      // Handle channel events
      this.channel.on('error', (err: Error) => {
        console.error('RabbitMQ channel error:', err);
        this.channel = null;
      });
      
      this.channel.on('close', () => {
        console.log('RabbitMQ channel closed');
        this.channel = null;
      });
      
      console.log('⚡️[RABBITMQ]: connection and channel initialized successfully');
    } catch (error) {
      console.error('Failed to establish RabbitMQ connection:', error);
      // Try to reconnect after a delay
      setTimeout(() => this.initializeConnection(), 5000);
    }
  }

  async getConnection(): Promise<amqplib.ChannelModel> {
    if (!this.connection) {
      try {
        this.connection = await amqplib.connect(RABBITMQ_CONFIG);
        
        // Handle connection events
        this.connection.on('error', (err: Error) => {
          console.error('RabbitMQ connection error:', err);
          this.connection = null;
        });
        
        this.connection.on('close', () => {
          console.log('RabbitMQ connection closed');
          this.connection = null;
        });
      } catch (error) {
        console.error('Failed to establish RabbitMQ connection:', error);
        throw error;
      }
    }
    
    if (!this.connection) {
      throw new Error('Failed to establish RabbitMQ connection');
    }
    
    return this.connection;
  }

  async getChannel(): Promise<amqplib.Channel> {
    if (!this.channel) {
      try {
        const conn = await this.getConnection();
        this.channel = await conn.createChannel();
        
        // Handle channel events
        this.channel.on('error', (err: Error) => {
          console.error('RabbitMQ channel error:', err);
          this.channel = null;
        });
        
        this.channel.on('close', () => {
          console.log('RabbitMQ channel closed');
          this.channel = null;
        });
      } catch (error) {
        console.error('Failed to create RabbitMQ channel:', error);
        throw error;
      }
    }
    
    if (!this.channel) {
      throw new Error('Failed to create RabbitMQ channel');
    }
    
    return this.channel;
  }

  async createQueue(queueName: string): Promise<string> {
    const ch = await this.getChannel();
    await ch.assertQueue(queueName, {
      durable: true,
    });
    return queueName;
  }

  async createWorker(
    queueName: string,
    processor: (msg: amqplib.ConsumeMessage) => Promise<void>
  ): Promise<void> {
    const ch = await this.getChannel();
    await ch.assertQueue(queueName, { durable: true });
    
    await ch.consume(queueName, async (msg) => {
      if (msg) {
        try {
          await processor(msg);
          ch.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          ch.nack(msg);
        }
      }
    });
  }
}

// Create a singleton instance
const rabbitMQService = new RabbitMQService();

// Export methods from the instance
export const getConnection = rabbitMQService.getConnection;
export const getChannel = rabbitMQService.getChannel;
export const createQueue = rabbitMQService.createQueue;
export const createWorker = rabbitMQService.createWorker;