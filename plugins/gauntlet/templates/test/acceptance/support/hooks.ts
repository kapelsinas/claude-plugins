import { Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import { ForgeWorld } from './world';

setDefaultTimeout(20_000);

Before(async function (this: ForgeWorld) {
  // Swap infrastructure for in-memory adapters when the scenario is not about persistence:
  // await this.boot((b) => b.overrideProvider(FooRepository).useClass(InMemoryFooRepository));
  await this.boot();
});

After(async function (this: ForgeWorld) {
  await this.shutdown();
});
