import { ReactElement } from 'react';
import { TestingAdaptor, TestingAdaptorInstance } from './adaptor';
import { ElementNode } from '../../reconciler/instance';

export class RenderResult {
  public constructor(private adaptorInstance: TestingAdaptorInstance) {}

  public getContainer = (): ElementNode => {
    return this.adaptorInstance.data;
  };

  // ByText

  public getByText = () => {
    // TODO:
  };

  public queryByText = () => {
    // TODO:
  };

  public findByText = () => {
    // TODO:
  };

  public resolveUpdateCallback = (renderId?: string) => {
    return this.adaptorInstance.resolveUpdateCallback(renderId);
  };

  public setManuallyResolvedUpdateCallback = (enabled: boolean) => {
    this.adaptorInstance.setManuallyResolvedUpdateCallback(enabled);
  };
}

export const render = (rootElement: ReactElement | null) => {
  const testingAdaptor = new TestingAdaptor();
  const testingAdaptorInstance = testingAdaptor.run(rootElement);
  return new RenderResult(testingAdaptorInstance);
};
