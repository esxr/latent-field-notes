---
title: "Building & Deploying an Agent with LangGraph"
date: "2025-01-17"
description: "Creating and deploying a RAG-based chatbot for Question Answering over website content using LangGraph"
tags: ["langgraph", "langchain-agents", "retrieval-augmented-gen"]
draft: false
---

This blog is part of a mini-series where I create and deploy a RAG (Retrieval Augmented Generation) based chatbot for Question Answering over website content using AI solution templates that I developed at AGAILE. This covers how to setup and deploy the backend on LangGraph.

LangGraph is the most popular platform for developing AI solutions. It provides ready templates for common AI solution patterns. We took its [retrieval agent template](https://github.com/langchain-ai/retrieval-agent-template) and customised it for our client needs. In the subsequent sections I describe those customisations in detail.

Please refer to the code in [this repo](https://github.com/esxr/retrieval-agent-template) to follow along.

## Start with langgraph template

Let's install the LangGraph CLI

```bash
pip install langgraph-cli --upgrade
```

Let's now create a new app from a template

```bash
langgraph new
```

## Indexing Graph Enhancements

Add starter\_urls, and hops to `IndexConfiguration` in `configuration.py`. Also add a method to get the list of urls from the comma-separated `starter_urls` string.

```python
starter_urls: str = field(
	default="https://zohlar.com",
	metadata={
		"description": "Comma-separated string of starter URLs to crawl for indexing web pages."
	},
)

hops: int = field(
 default=2,
 metadata={
  "description": "Maximum number of hops to traverse pages linked to the starter URLs."
 },
)

def parse_starter_urls(self) -> list[str]:
 """Parse the starter URLs into a list.
 Returns:
  list[str]: A list of URLs parsed from the comma-separated string.
 """
 return [url.strip() for url in self.starter_urls.split(",") if url.strip()]
```

## Support For Open-source Retriever (Milvus)

Milvus is open source, and its Lite version can work off a file URI. This makes things economical (for dev), and handy for demos.

Let's begin by adding `langchain-milvus` as a dependency in `pyproject.toml`

Then add `milvus` to `retriever_provider` list

```python
retriever_provider: Annotated[
	Literal["elastic", "elastic-local", "pinecone", "mongodb", "milvus"],
	{"__template_metadata__": {"kind": "retriever"}},
] = field(
	default="milvus",
	metadata={
		"description": "The vector store provider to use for retrieval. Options are 'elastic', 'pinecone', 'mongodb', or, 'milvus'."
	},
)
```

Now to add a new method to create a milvus retriever in `retrieval.py`

```python
@contextmanager
def make_milvus_retriever(
    configuration: IndexConfiguration, embedding_model: Embeddings
) -> Generator[VectorStoreRetriever, None, None]:
    """Configure this agent to use milvus lite file based uri to store the vector index."""
    from langchain_milvus.vectorstores import Milvus

vstore = Milvus (
    embedding_function=embedding_model,
    collection_name=configuration.user_id,
    connection_args={"uri": os.environ["MILVUS_DB"]},
    auto_id=True
)
yield vstore.as_retriever()
```

and then use this in the factory method

```python
@contextmanager
def make_retriever(
    config: RunnableConfig,
) -> Generator[VectorStoreRetriever, None, None]:
    # ... same code as before

match configuration.retriever_provider:
      # ... same code as before
      case "milvus":
          with make_milvus_retriever(configuration, embedding_model) as retriever:
              yield retriever
      case _:
          # ... as before
```

We'll also add the following file uri in `.env` to store the vector index:

```bash
## Milvus
MILVUS_DB=milvus.db
```

## Support for Crawling

Out of the box implementation of `index_graph` (in [index\_graph.py](https://github.com/esxr/retrieval-agent-template/blob/main/src/retrieval_graph/index_graph.py)) expects as input all the documents to be indexed. Since we are enhancing the graph to include an ingestion pipeline that crawls starting at the specified URL, we'll modify the `index_docs` node to kick start the crawl if docs list in the state is empty and `starter_urls` configuration has been provided.

### Custom Crawler (using Playright)

We can create a `Crawler Component` using `playwright`, which uses headless browsers (Note: Please add `playwright` & `requests` as dependencies in `pyproject.toml`)

You can access the code to that [here](https://github.com/esxr/retrieval-agent-template/blob/main/src/retrieval_graph/crawler.py).

> **_Note:_** _Just adding_ `playwright` _package to the python environment is not sufficient. The headless browser, and its dependencies also need to be installed. So we need to run_ `playright install` _, and_ `playwright install-deps` _as well._
>
> _You may use LangGraph Studio app on mac, using docker to locally deploy your graphs. In this case_ `playwright install` _and_ `playwright install-deps` _need to happen in the docker. For that we'll add the following to_ `langgraph.json`
>
> `"dockerfile_lines": ["RUN pip install playwright", "RUN python -m playwright install", "RUN python -m playwright install-deps"]`

### APIfy Crawler

For simpler usecases, we can also use a readymade apify based crawler. We have to modify the `indexx_graph.py` like so:

```python
# new imports
import json

from langchain_community.utilities import ApifyWrapper
from langchain_community.document_loaders import ApifyDatasetLoader
# ... existing code
def load_site_dataset_map() -> dict:
    with open("sites_dataset_map.json", 'r', encoding='utf-8') as file:
        return json.load(file)
def apify_crawl(tenant: str, starter_urls: list, hops: int):
    site_dataset_map = load_site_dataset_map()
    if dataset_id := site_dataset_map.get(tenant):
        loader = ApifyDatasetLoader(
            dataset_id=dataset_id,
            dataset_mapping_function=lambda item: Document(
                page_content=item["html"] or "", metadata={"url": item["url"]}
            ),
        )
    else:
        apify = ApifyWrapper()
        loader = apify.call_actor(
            actor_id="apify/website-content-crawler",
            run_input={
                "startUrls": starter_urls,
                "saveHtml": True,
                "htmlTransformer": "none"
            },
            dataset_mapping_function=lambda item: Document(
                page_content=item["html"] or "", metadata={"url": item["url"]}
            ),
        )
        print(f"Site: {tenant} crawled and loaded into Apify dataset: {loader.dataset_id}")
    return loader.load()
# ... existing code
async def index_docs(
    state: IndexState, *, config: Optional[RunnableConfig] = None
) -> dict[str, str]:
    # ... as before
    with retrieval.make_retriever(config) as retriever:
        # code to kick start crawl if required
        configuration = IndexConfiguration.from_runnable_config(config)
        if not state.docs and configuration.starter_urls:
            print(f"starting crawl ...")
            # state.docs = await crawl (
            #     configuration.user_id,
            #     configuration.parse_starter_urls(),
            #     configuration.hops
            # )
            state.docs = apify_crawl (
                configuration.user_id,
                [{"url": url} for url in configuration.parse_starter_urls()],
                configuration.hops
            )
        # rest remains the same as before
        stamped_docs = ensure_docs_have_user_id(state.docs, config)
        if configuration.retriever_provider == "milvus":
            retriever.add_documents(stamped_docs)
        else:
            await retriever.aadd_documents(stamped_docs)
    return {"docs": "delete"}
# ... existing code
```

I changed default values for parameters `saveHtml`, and `htmlTransformer` because, OpenAI embedding models understand HTML very well, and the clean up performed by html transformer loses some useful information.

## Handling Edge Cases

### Splitting documents for fine-grained retrieval

So far we directly embedded a crawled document. Crawled documents may be arbitrarily large.

1. This puts an uncertainity on how many `top_k` retrieval results we should consider for response generation.
2. For complex queries, where composing high quality answers may need information from multiple documents, limiting `top_k` may lead to poor results.

To address this, we split crawl documents into multiple documents as follows:

```python
# src/retrieval_graph/index_graph.py

# new import
from langchain_text_splitters import RecursiveCharacterTextSplitter
# same as before
async def index_docs(
    state: IndexState, *, config: Optional[RunnableConfig] = None
) -> dict[str, str]:
    if not config:
        raise ValueError("Configuration required to run index_docs.")
    with retrieval.make_retriever(config) as retriever:
        configuration = IndexConfiguration.from_runnable_config(config)
        if not state.docs and (configuration.starter_urls or configuration.apify_dataset_id):
            print(f"starting crawl ...")
            crawled_docs = apify_crawl(configuration)
            # use a 1000 char size overlapping window based splitter to create smaller document chunks to index
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            state.docs = text_splitter.split_documents(crawled_docs)

            # same as before
```

We can now retrieve a larger set of `top_k` results. Since the maximum chunk size here is `1000`, we can deterministically configure the `top_k` based on the token limits supported by the language model used in the response generation node. E.g., if the token limit is 100,000 tokens, we can potentially use `top_k` upto `500` (assuming an average token size of 5 characters).

```python
# src/retrieval_graph/retreival.py
# ...
def make_milvus_retriever(
    configuration: IndexConfiguration, embedding_model: Embeddings, **kwargs
) -> Generator[VectorStoreRetriever, None, None]:
    # ...
    yield vstore.as_retriever(search_kwargs=configuration.search_kwargs)
# ...
```

Here, `search_kwargs = {"k": 10}` conveys that retriever will return top 10 results.

### Rate limits during embedding

Embedding Models put limits on the number of token per unit time. Initially, we embedded the whole set of crawled (or split) documents in a single call. For large sites, this ran into rate limit errors.

With the following enhancement we can add a batch size configuration, split documents into multiple batches, and add a time delay to avoid rate limits.

```python
# src/retrieval_graph/configuration.py
# ...
@dataclass(kw_only=True)
class IndexConfiguration(CommonConfiguration):
    # ...
    batch_size: int = field(
        default=400,
        metadata={
            "description": "Number of documents to index in a single batch."
        },
    )
    # ...
```

```python
# src/retrieval_graph/index_graph.py
# ...

# generator function to create batches
def create_batches(docs, batch_size):
    """Chunk documents into smaller batches."""
    for i in range(0, len(docs), batch_size):
        yield docs[i:i + batch_size]
async def index_docs(
    state: IndexState, *, config: Optional[RunnableConfig] = None
) -> dict[str, str]:
    if not config:
        raise ValueError("Configuration required to run index_docs.")
    with retrieval.make_retriever(config) as retriever:
        configuration = IndexConfiguration.from_runnable_config(config)
        # ...
        stamped_docs = ensure_docs_have_user_id(state.docs, config)
        # embed in batches to avoid rate limit errors
        batch_size = configuration.batch_size
        for i, batch in enumerate(create_batches(stamped_docs, batch_size)):
            if configuration.retriever_provider == "milvus":
                retriever.add_documents(batch)
            else:
                await retriever.aadd_documents(batch)
            # sleep if there are more batches to embed
            if i < (len(stamped_docs) // batch_size):
                time.sleep(60)
    return {"docs": "delete"}
# ...
```

## Cloud Deployment

We can now deploy the retrieval graph to langgraph cloud. The process is quite straight-forward:

1. Create a Plus account on [LangSmith](https://smith.langchain.com/). This is necessary. Free-tier developer account does not allow deploying to LangGraph cloud. This costs 39 USD / month.
2. Now from LangSmith left-nav bar, go to _Deployments > LangGraph Platform_. Here we can initiate a + New Deployment.
3. We can _Import from GitHub_ my langGraph repo! And add environment configurations (the ones in `.env` file).
4. And just Submit to deploy! This step takes around 15+ minutes. Once this finishes, click on LangGraph Studio to access the studio to test the graphs!

## References

This blog was written in collaboration with Praneet Dhoolia ( [https://praneetdhoolia.github.io](https://praneetdhoolia.github.io/)) [https://praneetdhoolia.github.io/2024/12/31/expanding-langgraph-retrieval-template.html](https://praneetdhoolia.github.io/2024/12/31/expanding-langgraph-retrieval-template.html)
