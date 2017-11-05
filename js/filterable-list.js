/**
 * This code needs to be built to be used in production. Run the
 * following command at the command line to build:
 *
 *   buble filterable-list.js | uglifyjs --compress --mangle > filterable-list.min.js
 *
 * (Note: you can run ./build.sh in the root directory to do this)
 *
 * If you do not have these programs installed, you can install them with:
 *
 *   npm install -g buble uglify-js
 *
 */
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

  readStateFromUrl();

  /** initialize **/

  const root = d3.select(rootSelector);

  const inputContainer = root.append('div').attr('class', 'ui input');

  const input = inputContainer
    .append('input')
    .attr('type', 'text')
    .attr('class', 'filter-input')
    .attr('placeholder', 'Search...')
    .attr('value', inputString)
    .on('change keyup', function() {
      changeInputValue(this.value);
    });

  const tagList = root.append('div').attr('class', 'filter-tags');
  tagList
    .append('div')
    .attr('class', 'filter-label')
    .text('Filter by Tag');

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

    // update URL state
    writeStateToUrl();
  }

  /** render helpers **/

  function render() {
    renderTags();
    // renderFilteredList();
    renderGroupedFilteredList();
  }

  function renderTags() {
    const countByTag = filteredCountByTag();
    tagList
      .selectAll('.filter-tag-item')
      .classed('active', d => activeTags.includes(d))
      .classed('teal', d => activeTags.includes(d))
      .html(d => `${d} <span class="tag-count">${countByTag[d] || 0}</span>`);
  }

  // function renderFilteredList() {
  //   const binding = filteredList
  //     .selectAll('.filtered-list-item')
  //     .data(filteredData, d => d.id);
  //   binding.exit().remove();
  //   binding
  //     .enter()
  //     .append('li')
  //     .attr('class', 'filtered-list-item')
  //     .merge(binding)
  //     .html(renderItem);
  // }

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

  /** URL encoding and decoding**/
  function writeStateToUrl() {
    const encodedInputString = inputString.length
      ? encodeURIComponent(inputString)
      : undefined;
    const encodedTags = activeTags.length
      ? encodeURIComponent(activeTags.join('__'))
      : undefined;

    // write inputString to URL
    let url = window.location.href;
    url = updateQueryParam(url, 'q', encodedInputString);
    url = updateQueryParam(url, 'tags', encodedTags);

    window.history.replaceState({ encodedInputString, encodedTags }, '', url);
  }

  function readStateFromUrl() {
    const queryParams = getUrlQueryParams();

    inputString = queryParams.q || '';
    if (queryParams.tags) {
      activeTags = queryParams.tags.split('__');
    } else {
      activeTags = [];
    }
  }

  /** data processing **/
  // create a map from tag to count of filtered items
  function filteredCountByTag() {
    return filteredData.reduce((accum, item) => {
      if (item[tagKey]) {
        item[tagKey].forEach(tag => {
          if (accum[tag] == null) {
            accum[tag] = 1;
          } else {
            accum[tag] += 1;
          }
        });
      }
      return accum;
    }, {});
  }

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

    return Object.keys(tagMap).sort();
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

    // which tags the item has
    let tagValue = item[tagKey];
    if (!Array.isArray(tagValue)) {
      tagValue = [tagValue];
    }

    // make sure all the active tags are in the item's tags
    const hasAllTags = activeTags.every(activeTag =>
      tagValue.includes(activeTag)
    );

    return hasAllTags;
  }

  function itemMatchesInputString(item) {
    if (!inputString.trim().length) {
      return true;
    }

    const excludedKeys = ['html', 'id'];

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

// from https://stackoverflow.com/questions/5999118/how-can-i-add-or-update-a-query-string-parameter
function updateQueryParam(uri, key, value) {
  var re = new RegExp('([?&])' + key + '=.*?(&|#|$)', 'i');
  if (value === undefined) {
    if (uri.match(re)) {
      // modified to remove excessive &s and empty ?
      return uri
        .replace(re, '$1$2')
        .replace(/&+/g, '&')
        .replace(/&$/, '')
        .replace(/\?$/, '');
    } else {
      return uri;
    }
  } else {
    if (uri.match(re)) {
      return uri.replace(re, '$1' + key + '=' + value + '$2');
    } else {
      var hash = '';
      if (uri.indexOf('#') !== -1) {
        hash = uri.replace(/.*#/, '#');
        uri = uri.replace(/#.*/, '');
      }
      var separator = uri.indexOf('?') !== -1 ? '&' : '?';
      return uri + separator + key + '=' + value + hash;
    }
  }
}

// from https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function getUrlQueryParams() {
  var match,
    pl = /\+/g, // Regex for replacing addition symbol with a space
    search = /([^&=]+)=?([^&]*)/g,
    decode = function(s) {
      return decodeURIComponent(s.replace(pl, ' '));
    },
    query = window.location.search.substring(1);

  urlParams = {};
  while ((match = search.exec(query)))
    urlParams[decode(match[1])] = decode(match[2]);

  return urlParams;
}
