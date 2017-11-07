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
 * Note that `data` is of the form:
 * [
 *   {
       header: "Some Header",
       id: "something",
       groupBy: "publication_year",
       groupByLabels: { key: label, ... },
       items: [item1, item2, ...]
     },
 *   ...
 * ]
 *
 * See publications.html to see publications.html for example usage.
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
  let filteredFlatData;
  let groupedFilteredData;
  // for convenience, create a fully flat list of the data
  const flatData = data.reduce((accum, entry) => accum.concat(entry.items), []);

  // find the list of tags from the data
  const tags = discoverTagsFromData(flatData);

  // look into query parameters to populate initial state
  readStateFromUrl();

  /** initialize **/
  const root = d3.select(rootSelector);

  // add in the keyword search filter
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

  // add in the tag filter
  const tagList = root.append('div').attr('class', 'filter-tags');
  tagList
    .append('div')
    .attr('class', 'filter-label')
    .text('Filter by Tag');

  // for each tag, create a pill to represent it
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

  // add a message to be shown when no items match the filters
  const emptyMessage = root
    .append('p')
    .attr('class', 'empty-message')
    .text('No publications match the current filters.')
    .style('display', 'none');

  // the parent for where the grouped filtered lists will be stored
  const filteredList = root.append('div').attr('class', 'filtered-list');

  // filter and render the data
  update();

  function update() {
    // re-filter data
    filterData();
    render();

    // update URL state
    writeStateToUrl();
  }

  /** render helpers **/
  // re-render everything
  function render() {
    renderTags();
    renderAllGroups();
  }

  // render the tags. Just has to update the counts and whether
  // or not they are active. No enter/exit/update required since
  // the list of tags never changes.
  function renderTags() {
    const countByTag = filteredCountByTag();
    tagList
      .selectAll('.filter-tag-item')
      .classed('active', d => activeTags.includes(d))
      .classed('teal', d => activeTags.includes(d))
      .html(d => `${d} <span class="tag-count">${countByTag[d] || 0}</span>`);
  }

  // render the filtered grouped lists
  function renderAllGroups() {
    // for each super group (e.g. Academic, Theses, Non-Academic, etc.)
    const binding = filteredList
      .selectAll('.filtered-list-super-group')
      .data(groupedFilteredData, d => d.id);

    // remove those that are no longer matching the filters
    binding.exit().remove();

    // add in ones that were not previously matched or rendered
    const entering = binding
      .enter()
      .append('div')
      .attr('class', 'filtered-list-super-group');

    entering
      .append('h2')
      .attr('class', 'ui header')
      .attr('id', d => d.id)
      .text(d => d.header);

    // create node where grouped items will live (e.g. papers by year)
    entering.append('div').attr('class', 'filtered-list-super-group-items');

    // render the grouped item lists for each super group
    entering
      .merge(binding)
      .select('.filtered-list-super-group-items')
      .each(function(d) {
        const groupRoot = d3.select(this);
        renderGroupedFilteredList(d.groupedItems, groupRoot, d);
      });

    // if there are any items that match the filters, hide the empty message,
    // otherwise show it.
    if (groupedFilteredData.length) {
      emptyMessage.style('display', 'none');
    } else {
      emptyMessage.style('display', '');
    }
  }

  /**
   * Render a grouped list e.g. a collection of Academic papers that are
   * grouped by year.
   *
   * @param {Object} groupData The entry of group data { key, values }

   */
  function renderGroupedFilteredList(groupData, root, groupEntry) {
    // for each group within groupData, bind the data.
    // e.g. for each year
    const binding = root
      .selectAll('.filtered-list-group')
      .data(groupData, d => d.key);

    // remove those no longer matched by filters
    binding.exit().remove();

    // add those newly matched
    const entering = binding
      .enter()
      .append('div')
      .attr('class', 'filtered-list-group');

    // create object for overriding keys to be user specified labels
    const groupByLabels = Object.assign(
      { __null: 'Other' },
      groupEntry.groupByLabels
    );

    // for each new group, add a header using the specified label
    // or the key if not provided.
    entering
      .append('h3')
      .attr('class', 'ui header')
      .text(d => {
        const label = groupByLabels[d.key];
        if (label == null) {
          return d.key;
        }
        return label;
      });

    // add a list for the papers within a group, adding in user-specified class
    const enteringLists = entering
      .append('ul')
      .attr(
        'class',
        'filtered-list-group-list ' + (listClass ? listClass : '')
      );

    // render the lists for each group
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
      .html(renderItem); // use the user-specified renderItem function
  }

  /** URL encoding and decoding**/

  // write state to query parameters for tags and keyword search
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

  // read in state from query parameters for tags and keyword search
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
    return filteredFlatData.reduce((accum, item) => {
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

  // find all tags in the data and sort them
  function discoverTagsFromData(flatData) {
    const tagMap = {};
    flatData.forEach(d => {
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

  // filter the data based on selected tags and keyword search
  function filterData() {
    // filter based on tag then keyword search in the flat list
    filteredFlatData = flatData
      .filter(itemMatchesActiveTags)
      .filter(itemMatchesInputString);

    // filter based on tag then keyword search for each of the groups
    groupedFilteredData = data
      .map(entry => {
        const groupFilteredData = entry.items
          .filter(itemMatchesActiveTags)
          .filter(itemMatchesInputString);

        // allow individual entries to specify their own groupBy field
        const entryGroupBy = entry.groupBy || groupBy;

        // group the items by the groupBy field and sort based on key.
        const groupedItems = d3
          .nest()
          .key(d => (d[entryGroupBy] == null ? '__null' : d[entryGroupBy]))
          .entries(groupFilteredData)
          .sort((a, b) => b.key - a.key);

        // expand the entry to have groupedItems in it (non destructively)
        return Object.assign({}, entry, {
          groupedItems,
        });
      })
      // remove groups with no items matching the filters
      .filter(groupedData => groupedData.groupedItems.length > 0);
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

  // true if the item matches the input string in any of its properites
  // excluding html and id. Ignores case.
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

  // toggle a tag as active or not
  function toggleFilterTag(tag) {
    const tagIndex = activeTags.indexOf(tag);
    if (tagIndex !== -1) {
      // remove
      activeTags.splice(activeTags.indexOf(tag), 1);
    } else {
      // add
      activeTags.push(tag);
    }

    // re-render the UI
    update();
  }

  function changeInputValue(value) {
    inputString = value;

    // re-render the UI
    update();
  }
}

// top level function to clear a container. this is useful since
// we want the server to render contents for better SEO, then we
// clear it and have the JS re-render.
function clearContents(rootSelector) {
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
