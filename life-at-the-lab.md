---
layout: page
title: Life at the Lab
description: This page will be pretty soon.
images:
 - ../img/group-walk-mit.jpg
 - ../img/tim-cook.jpg
 - ../img/deb-skype.jpg
 - ../img/eclipse-group.jpg
 - ../img/eclipse-jules-shana.jpg
 - ../img/saquib-eclipse.jpg
 - ../img/sesame-talk.jpg
---
<div class="ui four column grid">
{% for image in page.images %}
  <div class="column">
    <img src="{{ image }}" class="ui medium image" />
  </div>
{% endfor %}
</div>
