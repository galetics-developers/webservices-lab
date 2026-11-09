import { Controller, Get, HttpStatus, Inject, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DatabaseService } from '../database/database.service.js';

interface DependencyStatus {
  status: 'up' | 'down' | 'not_configured';
  latencyMs?: number;
  error?: string;
}

interface HealthReport {
  status: 'ok' | 'error';
  uptimeSeconds: number;
  checks: Record<string, DependencyStatus>;
}

@Controller('health')
export class HealthController {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService | null) {}

  @Get()
  live(): { status: 'ok'; uptimeSeconds: number } {
    return { status: 'ok', uptimeSeconds: Math.round(process.uptime()) };
  }

  @Get('ready')
  async ready(@Res() res: Response): Promise<void> {
    const report: HealthReport = {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      checks: { database: await this.checkDatabase() },
    };

    if (Object.values(report.checks).some((check) => check.status === 'down')) {
      report.status = 'error';
    }

    res
      .status(report.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
      .json(report);
  }

  private async checkDatabase(): Promise<DependencyStatus> {
    if (!this.db) return { status: 'not_configured' };

    const start = performance.now();
    try {
      await this.db.ping();
      return { status: 'up', latencyMs: Math.round(performance.now() - start) };
    } catch (error) {
      return {
        status: 'down',
        latencyMs: Math.round(performance.now() - start),
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }
}
