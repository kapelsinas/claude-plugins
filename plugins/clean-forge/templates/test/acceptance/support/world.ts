// Clean Forge acceptance world. Boots the Nest application once per scenario.
// Steps reach the app through use cases (fast) or HTTP (supertest) — never repositories.
import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module'; // <- adjust

export class ForgeWorld extends World {
  app!: INestApplication;
  lastResult: unknown;
  lastError: unknown;

  constructor(opts: IWorldOptions) { super(opts); }

  async boot(overrides: (b: TestingModuleBuilder) => TestingModuleBuilder = (b) => b) {
    const moduleRef = await overrides(Test.createTestingModule({ imports: [AppModule] })).compile();
    this.app = moduleRef.createNestApplication();
    await this.app.init();
  }

  get<T>(token: unknown): T { return this.app.get<T>(token as never); }

  async run<T>(fn: () => Promise<T>): Promise<void> {
    this.lastError = undefined;
    try { this.lastResult = await fn(); } catch (e) { this.lastError = e; }
  }

  async shutdown() { await this.app?.close(); }
}

setWorldConstructor(ForgeWorld);
