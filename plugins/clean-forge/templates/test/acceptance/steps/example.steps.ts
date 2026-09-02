// Example step definitions. Delete once real ones exist. Steps speak domain language only.
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { ForgeWorld } from '../support/world';

Given('a product with a base price of {float}', async function (this: ForgeWorld, price: number) {
  // const createProduct = this.get<CreateProduct>(CreateProduct);
  // this.lastResult = await createProduct.execute({ name: 'p', price });
  throw new Error(`pending: seed product at ${price}`);
});

When('a percentage discount of {int} is applied', async function (this: ForgeWorld, pct: number) {
  await this.run(async () => { throw new Error(`pending: apply ${pct}%`); });
});

Then('the effective price is {float}', function (this: ForgeWorld, expected: number) {
  assert.equal(this.lastError, undefined);
  assert.equal((this.lastResult as { effectivePrice: number }).effectivePrice, expected);
});
