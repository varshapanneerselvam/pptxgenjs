import requests
from bs4 import BeautifulSoup
from openai import OpenAI
import httpx
from data import presentation_json
import re


# Step 1: Fetch documentation text
def fetch_doc_text(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")
    return soup.get_text(separator="\n")


# Your pptxgenjs docs link
doc_link = "https://gitbrent.github.io/PptxGenJS/"
doc_text = fetch_doc_text(doc_link)

# Step 2: Setup OpenAI client
openai_client = OpenAI(
    api_key="none",
    base_url="https://infin",
    http_client=httpx.Client(verify=False),
)

# Step 3: Prepare LLM input
llm_input = [
    {
        "role": "system",
        "content": """.............""",
    },
    {
        "role": "user",
        "content": f"""
                this is the presentation json: {presentation_json}
            """,
    },
]


def extract_code(output_text, content_type, fallback_lang):
    """
    Extracts code from <xaiArtifact> tags or from ``` code blocks if artifacts are missing.
    """
    # Try <xaiArtifact> first
    match = re.search(
        rf"<xaiArtifact[^>]*contentType\s*=\s*\"{content_type}\"[^>]*>(.*?)</xaiArtifact>",
        output_text,
        re.DOTALL | re.IGNORECASE,
    )
    if match:
        return match.group(1).strip()

    # Fallback to ```lang``` code block
    match = re.search(
        rf"```{fallback_lang}(.*?)```", output_text, re.DOTALL | re.IGNORECASE
    )
    if match:
        return match.group(1).strip()

    return None


def main():
    try:
        llm_response = openai_client.chat.completions.create(
            model="meta/llama-3.3-70b-instruct",
            messages=llm_input,
            max_tokens=4096,  # enough for HTML + JS
            temperature=0,
        )
        output_text = llm_response.choices[0].message.content
        print("Raw LLM Response (Preview):\n", output_text[:500], "...")

        js_code = extract_code(output_text, "application/javascript", "javascript")
        if js_code:
            with open("presentation.js", "w", encoding="utf-8") as f:
                f.write(js_code)
            print("✅ Saved presentation.js")
        else:
            print("⚠️ No JavaScript code found.")

    except Exception as e:
        print(e)


if __name__ == "__main__":
    main()
