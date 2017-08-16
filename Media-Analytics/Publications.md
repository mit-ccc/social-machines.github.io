---
layout: page
title: Media Analytics Publications
description: This page is under construction
---
## Publications

{% comment %}Start with the full set of publications{% endcomment %}
{% assign filtered_publications = site.data.publications %}
{% comment %}
	Use this version to filter to only a group's publications.
	{% assign filtered_publications = site.data.publications | where: 'group', 'learning' %}
{% endcomment %}

{% assign pub_by_year = filtered_publications | group_by: 'publication_year' %}
{% for pub_year in pub_by_year  %}
### {{ pub_year.name }}

{% for pub in pub_year.items %}
{{ pub.citation }} {% if pub.pdf_file %}[PDF]({{ pub.pdf_file }}){% endif %}
{% endfor %}

{% endfor %}


# OLD STUFF BELOW

### 2016
Prashanth Vijayaraghavan, Ivan Sysoev, Soroush Vosoughi and Deb Roy. (2016). DeepStance at SemEval-2016 Task 6: Detecting Stance in Tweets Using Character and Word-Level CNNs. In Proceedings of the 10th International Workshop on Semantic Evaluation (SemEval-2016). San Diego, California. [PDF](

Soroush Vosough and Deb Roy. (2016). A Semi-automatic Method for Efficient Detection of Stories on Social Media. In Proceedings of the 10th International AAAI Conference on Weblogs and Social Media (ICWSM 2016). Cologne, Germany. pdf (221KB)

Soroush Vosough*, Prashanth Vijayaraghavan* and Deb Roy. (2016). Tweet2Vec: Learning Tweet Embeddings using Character-level CNN-LSTM Encoder-Decoder. Proceedings of the 39th International ACM SIGIR Conference on Research and Development in Information Retrieval (SIGIR 2016). Pisa, Italy. *Equal Contribution. pdf (652KB)

Martin Saveski, Sophie Chou, and Deb Roy. (2016). Tracking the Yak: An Empirical Study of Yik Yak. In proceedings of 10th International Conference on Web Search and Data Mining (ICWSM’16). Cologne, Germany. pdf (1.1MB)

Prashanth Vijayaraghavan*, Soroush Vosoughi*, and Deb Roy. (2016). Automatic Detection and Categorization of Election-Related Tweets. In Proceedings of the 10th International AAAI Conference on Weblogs and Social Media (ICWSM 2016). Cologne, Germany. *Equal Contribution. pdf (645KB)

David Alvarez-Melis and Martin Saveski. (2016). Topic Modeling in Twitter: Aggregating Tweets by Conversations. In proceedings of 10th International Conference on Web Search and Data Mining (ICWSM’16). Cologne, Germany. pdf (197KB)

Soroush Vosoughi, and Deb Roy. (2016). Tweet Acts: A Speech Act Classifier for Twitter. In Proceedings of the 10th International AAAI Conference on Weblogs and Social Media (ICWSM 2016). Cologne, Germany. Cologne, Germany. pdf (312KB)

Soroush Vosoughi, Russell Stevens, and Deb Roy. (2016). Addressing the Demographic Bias on Twitter. The 71st Annual Conference of the American Association for Public Opinion Research (AAPOR). Austin, Texas. pdf (79KB)
