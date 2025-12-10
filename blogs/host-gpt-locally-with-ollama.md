---
title: "Host GPT Locally with Ollama"
date: "2024-01-23"
description: "Hosting LLMs locally with Ollama and adding a UI using Ollama WebUI"
tags: ["ollama", "gpt", "llm", "local-llm"]
draft: false
---

![](https://miro.medium.com/v2/resize:fit:700/0*Lgz-7UROlu2p0Qd2.png)

Let's declare independence. Independence from $20 a month for ChatGPT subscription. and independence from having to be connected all the time.

Empowered with an Apple M2 MacBook Air (and just 16 GB RAM), we start with local deployment and running of large language models!

You can check out [esxr.io](https://esxr.io/) for more.

## Ollama

Based on a quick research and exploration of [vLLM](https://docs.vllm.ai/), [llamaCPP](https://github.com/ggerganov/llama.cpp), and [Ollama](https://ollama.ai/), let me recommend Ollama! It is a great way to deploy quantized versions of LLMs on personal computers.

Let's start by installing Ollama.

![](https://miro.medium.com/v2/resize:fit:631/0*FwsQV48WHwQCuIvI.png)

Let's also take a quick look on [leaderboard of LLMs](https://huggingface.co/spaces/lmsys/chatbot-arena-leaderboard).

![](https://miro.medium.com/v2/resize:fit:700/0*7WtnLT9YUqhc843P.png)

## Choosing a suitable model

The 16 GB of RAM we have might pose a slight challenge. A 7 billion parameter model, at full 32-bit precision, would require approximately 28 GB of RAM. However, at half precision (16 bits), it would need around 14 GB, and at 8-bit precision, about 7 GB. Therefore, a 7 billion parameter model with 8-bit quantization appears to be a viable option for our hardware specifications. Let's choose **Zephyr-7B-beta**!

![](https://miro.medium.com/v2/resize:fit:700/0*twK3U7Kog6nSjm8x.png)

## Quantization

Now, we obviously can't run a full model on our computer. We will use **quantization**.

> _Model quantization in Large Language Models (LLMs) is like compressing a large, detailed photo into a smaller file size. It reduces the size of model's "weight matrices" (by losing precision) to make it faster and use less computer memory while multiplying matrices in the background, similar to making a photo easier to send or load, but with slightly less detail. (for e.g. multiplying 2 doubles is more costly than multiplying 2 ints)_

![](https://miro.medium.com/v2/resize:fit:516/0*kms7QFxaMrZqPBoD.png)

You can know more about quantization in detail [here](https://huggingface.co/docs/optimum/concept_guides/quantization).

![](https://miro.medium.com/v2/resize:fit:700/0*aQjnjUJviYPTLIVb.png)

## Getting a Quantized Model

Upon conducting research, we discover **TheBloke** on Huggingface, who is well known for publishing quantized versions of various models. Our next step is to explore his workspace on Huggingface to identify suitable quantized models for our needs.

![](https://miro.medium.com/v2/resize:fit:700/0*opS6e2XEB-f6iLTq.png)

Based on these use case notes it seems Q5\_K\_M quantization may be one of the best bargains for us.

Now let's check, if Ollama has [this model](https://ollama.ai/library/zephyr/tags), in the quantization we want.

![](https://miro.medium.com/v2/resize:fit:700/0*_JulqGuEGeNfHBj7.png)

## Running and testing the Model

Amazing! Let's run a quick test. Let's get our model to program Levenshtein distance function.

We type `ollama run zephyr:7b-beta-q5_K_M` in the terminal, and we get something like this.

![](https://miro.medium.com/v2/resize:fit:700/0*Zp3lJW8qX3gOZwb8.png)

Now, we ask the question.

![](https://miro.medium.com/v2/resize:fit:700/0*dZSYZ-XacFDMd3xS.png)

Amazing! We just ran an LLM model on our very own machine!

## Ollama WebUI

While command line is good, let's get ourselves a ChatGPT like user experience. Amidst several user experience options available, I really liked [Ollama Web UI](https://github.com/ollama-webui/ollama-webui). Let's install and run it locally.

```bash
git clone https://github.com/ollama-webui/ollama-webui.git
cd ollama-webui
```

Follow the steps given in the [repo](https://github.com/ollama-webui/ollama-webui.git) to setup and run the UI. You can also check out [esxr.io](https://esxr.io/).

Now let's run the same query using our newly installed UI.

![](https://miro.medium.com/v2/resize:fit:700/0*DiS1G-LHn5jlCZwm.png)

Like ChatGPT, this system also maintains a record of our queries, allowing us to revisit them later. With this capability, we now have a personal LLM to perform tasks for us within our own computing environment.

## Conclusion

In this blog, we have successfully installed and run a Large Language Model on our personal machine, leveraging Ollama. For convenience, we integrated it with a ChatGPT-style user-interface. We also learnt about model quantization, a technique enabling us to scale down large models with a trade-off in precision. This allows models to be hosted on personal computing environments, which typically have lesser computational power.

This blog serves as a foundational guide for any future projects in the realm of generative AI and LLMs, providing a solid base for exploration and development in this exciting field.

You can check out [esxr.io](https://esxr.io/) for more fun stuff!
