function createFilterableList({
  rootSelector,
  title,
  data,
  tagKey,
  groupBy,
  renderItem,
  listClass,
}) {
  /** filter state **/
  let inputString = '';
  let activeTags = [];
  let filteredData;
  let groupedFilteredData;

  /** initialize **/

  const root = d3.select(rootSelector);
  root
    .append('h1')
    .attr('class', 'ui header')
    .text(title);

  const inputContainer = root.append('div').attr('class', 'ui input');

  const input = inputContainer
    .append('input')
    .attr('type', 'text')
    .attr('class', 'filter-input')
    .on('change keyup', function() {
      changeInputValue(this.value);
    });

  const tagList = root.append('div').attr('class', 'filter-tags');

  const tags = discoverTagsFromData(data);

  tagList
    .selectAll('a')
    .data(tags)
    .enter()
    .append('a')
    .attr('class', 'filter-tag-item ui label')
    .on('click', toggleFilterTag)
    .classed('active', d => activeTags.includes(d))
    .classed('teal', d => activeTags.includes(d))
    .text(d => d);

  const filteredList = root.append('div').attr('class', 'filtered-list');

  update();

  function update() {
    // re-filter data
    filterData();
    render();
  }

  /** render helpers **/

  function render() {
    renderTags();
    // renderFilteredList();
    renderGroupedFilteredList();
  }

  function renderTags() {
    tagList
      .selectAll('.filter-tag-item')
      .classed('active', d => activeTags.includes(d))
      .classed('teal', d => activeTags.includes(d));
  }

  function renderFilteredList() {
    const binding = filteredList
      .selectAll('.filtered-list-item')
      .data(filteredData, d => d.id);
    binding.exit().remove();
    binding
      .enter()
      .append('li')
      .attr('class', 'filtered-list-item')
      .merge(binding)
      .html(renderItem);
  }

  function renderGroupedFilteredList() {
    const binding = filteredList
      .selectAll('.filtered-list-group')
      .data(groupedFilteredData, d => d.key);
    binding.exit().remove();
    const entering = binding
      .enter()
      .append('div')
      .attr('class', 'filtered-list-group');

    entering
      .append('h3')
      .attr('class', 'ui header')
      .text(d => (d.key === '__null' ? 'Other' : d.key));

    const enteringLists = entering
      .append('ul')
      .attr(
        'class',
        'filtered-list-group-list ' + (listClass ? listClass : '')
      );

    // TODO - handle data binding

    // render the lists
    const itemBinding = entering
      .merge(binding)
      .select('ul')
      .selectAll('.filtered-list-item')
      .data(d => d.values, d => d.id);
    itemBinding.exit().remove();
    itemBinding
      .enter()
      .append('li')
      .attr('class', 'filtered-list-item')
      .merge(itemBinding)
      .html(renderItem);
  }

  /** data processing **/
  function discoverTagsFromData() {
    const tagMap = {};
    data.forEach(d => {
      const tagValue = d[tagKey];
      if (tagValue != null) {
        if (!Array.isArray(tagValue)) {
          tagMap[tagValue] = true;
        } else {
          tagValue.forEach(tag => {
            tagMap[tag] = true;
          });
        }
      }
    });

    return Object.keys(tagMap);
  }

  function filterData() {
    // filter based on tag
    filteredData = data
      .filter(itemMatchesActiveTags)
      .filter(itemMatchesInputString);

    groupedFilteredData = d3
      .nest()
      .key(d => (d[groupBy] == null ? '__null' : d[groupBy]))
      .entries(filteredData)
      .sort((a, b) => b.key - a.key);
  }

  // true if the item matches one of the active tags, false otherwise
  function itemMatchesActiveTags(item) {
    if (!activeTags.length) {
      return true;
    }

    let tagValue = item[tagKey];
    if (!Array.isArray(tagValue)) {
      tagValue = [tagValue];
    }

    for (const value of tagValue) {
      for (const activeTag of activeTags) {
        if (value === activeTag) {
          return true;
        }
      }
    }

    return false;
  }

  function itemMatchesInputString(item) {
    if (!inputString.trim().length) {
      return true;
    }

    const excludedKeys = ['html'];

    const itemStringValue = Object.keys(item)
      .filter(key => !excludedKeys.includes(key))
      .map(key => item[key])
      .join('\n')
      .toLowerCase();

    const matches = itemStringValue.includes(inputString.trim().toLowerCase());

    return matches;
  }

  /** handlers **/

  function toggleFilterTag(tag) {
    const tagIndex = activeTags.indexOf(tag);
    if (tagIndex !== -1) {
      // remove
      activeTags.splice(activeTags.indexOf(tag), 1);
    } else {
      // add
      activeTags.push(tag);
    }

    update();
  }

  function changeInputValue(value) {
    inputString = value;

    update();
  }
}

function clearData(rootSelector) {
  d3.select(rootSelector).html('');
}
