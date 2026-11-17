import { ITraverseRelationsGateway } from "./ITraverseRelationsGateway.js";
import { RelationTraversalResult } from "./RelationTraversalResult.js";
import { TraverseRelationsRequest } from "./TraverseRelationsRequest.js";

export class TraverseRelationsController {
  constructor(private readonly gateway: ITraverseRelationsGateway) {}

  async handle(
    request: TraverseRelationsRequest,
  ): Promise<RelationTraversalResult> {
    return this.gateway.traverse(request);
  }
}
