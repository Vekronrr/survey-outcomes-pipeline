import re
from collections import Counter
from typing import List

STOP_WORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "up", "about", "into", "through", "during",
    "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
    "do", "does", "did", "will", "would", "could", "should", "may", "might",
    "i", "me", "my", "we", "our", "you", "your", "he", "she", "it", "they",
    "them", "their", "what", "which", "who", "this", "that", "these", "those",
    "am", "not", "very", "just", "also", "so", "can", "its", "if", "as",
    "than", "then", "when", "where", "how", "all", "each", "any", "both",
    "more", "most", "other", "some", "such", "no", "nor", "only", "own",
    "too", "get", "got", "make", "made", "able", "really", "many", "much",
    "still", "after", "before", "during", "while", "since", "new", "use",
    "used", "using", "well", "good", "great", "every", "even", "back",
    "without", "within", "between", "over", "under", "again", "further",
    "then", "once", "here", "there", "few", "now", "same", "one", "two",
    "think", "know", "want", "feel", "need", "like", "see", "look", "come",
    "find", "give", "take", "keep", "let", "put", "seem", "go", "going",
    "sure", "s", "t", "ve", "re", "ll", "don", "didn", "doesn", "hasn",
}


def generate_word_frequency(responses: List[str], top_n: int = 60) -> List[dict]:
    all_words: List[str] = []

    for response in responses:
        if not response or not isinstance(response, str):
            continue
        words = re.findall(r"\b[a-z]{3,}\b", response.lower())
        all_words.extend(w for w in words if w not in STOP_WORDS)

    if not all_words:
        return []

    counts = Counter(all_words)
    most_common = counts.most_common(top_n)
    max_count = most_common[0][1]

    return [
        {
            "text": word,
            "value": count,
            "size": round(14 + (count / max_count) * 52),
        }
        for word, count in most_common
    ]
