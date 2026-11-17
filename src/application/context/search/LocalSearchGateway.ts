import { ISearchGateway } from "./ISearchGateway.js";
import { ISearchProvider } from "./ISearchProvider.js";
import { SearchHit } from "./SearchHit.js";
import { SearchHitGroup } from "./SearchHitGroup.js";
import { SearchRequest } from "./SearchRequest.js";
import { SearchResponse } from "./SearchResponse.js";
import { SearchResultLimit } from "./SearchResultLimit.js";

export class LocalSearchGateway implements ISearchGateway {
  constructor(private readonly providers: readonly ISearchProvider[]) {}

  async search(request: SearchRequest): Promise<SearchResponse> {
    const providerHits = await Promise.all(
      this.providers.map((provider) => provider.search(request.criteria)),
    );
    const hits = this.limitHits(
      this.sortHits(this.filterHits(providerHits.flat(), request)),
      request,
    );

    if (!request.criteria.groupByCategory) {
      return { hits };
    }

    return { hits, groups: this.groupByCategory(hits) };
  }

  private filterHits(
    hits: readonly SearchHit[],
    request: SearchRequest,
  ): SearchHit[] {
    if (!request.criteria.category) {
      return [...hits];
    }

    return hits.filter((hit) => hit.category === request.criteria.category);
  }

  private sortHits(hits: readonly SearchHit[]): SearchHit[] {
    return [...hits].sort((left, right) => right.score - left.score);
  }

  private limitHits(
    hits: readonly SearchHit[],
    request: SearchRequest,
  ): SearchHit[] {
    const limit = Math.min(
      Math.max(
        request.criteria.limit ?? SearchResultLimit.DEFAULT,
        SearchResultLimit.MIN,
      ),
      SearchResultLimit.MAX,
    );

    return hits.slice(0, limit);
  }

  private groupByCategory(hits: readonly SearchHit[]): SearchHitGroup[] {
    const groups = new Map<string, SearchHit[]>();

    for (const hit of hits) {
      const group = groups.get(hit.category) ?? [];
      group.push(hit);
      groups.set(hit.category, group);
    }

    return [...groups.entries()].map(([category, groupedHits]) => ({
      category,
      hits: groupedHits,
    }));
  }
}
