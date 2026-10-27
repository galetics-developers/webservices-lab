import { Module } from '@nestjs/common';
import { ConsumersModule } from '../consumers/consumers.module.js';
import { GatewayController } from './gateway.controller.js';

@Module({
  imports: [ConsumersModule],
  controllers: [GatewayController],
})
export class GatewayModule {}
