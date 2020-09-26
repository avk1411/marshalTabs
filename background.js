
var output = [];
chrome.browserAction.onClicked.addListener(function (tab) {
    //find windowid
    console.log("Ok Clicked!");
    var currentWindow = tab.windowId;

    //get current tabs
    chrome.tabs.query({windowId : currentWindow},function (tabs) {
        //console.log(tabs);

        // delete duplicate tabs/ new tabs if more than one
        var duplicateTabs = tabs.filter(function (item,index) {
            return tabs.findIndex(function (tab) {
                return tab.url == item.url;
            }) !=index;
        })
        //console.log(duplicateTabs);
        for (var i = 0, len = duplicateTabs.length; i < len; i++) {
            chrome.tabs.remove(duplicateTabs[i].id);
        }
        var uniqueTabs = tabs.filter(function(item){
            return duplicateTabs.includes(item) == false;
        });
        // console.log("uniqueTabs");
        console.log(uniqueTabs);

        //marshal
        var marshalledTabs = marshal(uniqueTabs);
        console.log(marshalledTabs);
        //move tabs
        chrome.tabs.move(marshalledTabs,{index : -1});

    });
    

});

//marshal

function marshal(tabs) {
    var iconMap = new Map();
    output = [];
    // create mapping for icon to tabs
    for (var i = 0, len = tabs.length; i < len; i++) {

        if (typeof (tabs[i].favIconUrl) === "undefined") {
            output.push(tabs[i]);
        }
        else {
            if (!iconMap.has(tabs[i].favIconUrl)) {
                iconMap.set(tabs[i].favIconUrl, [tabs[i]]);
            }
            else {
                var currentValue = iconMap.get(tabs[i].favIconUrl);
                currentValue.push(tabs[i]);
                iconMap.set(tabs[i].favIconUrl, currentValue);
            }
        }
    }
    console.log(output);
    // group and reorder tabs 
    iconMap.forEach(processIcon);

    output.forEach(function (item, index) {
        output[index] = item.id;
    });
    return output;
}

function processIcon(value, key, map) {

    if (value.length > 2) {
        map.set(key, clustering(value));
    }
    output.push(...value);
}

function clustering(tabs) {
    var simScores = [];

    for (var i = 0, len = tabs.length; i < len; i++) {
        var row = [];
        // calculate scores for all pairs
        for (var j = 0, len = tabs.length; j < len; j++) {
            if (i == j) {
                row.push(0);
            }
            else {
                var score = jaccardSimilarity(tabs[i].title, tabs[j].title);
                //console.log("i = " + i + "j = " + j + "simScore = " + score);
                row.push(score);
            }
        }
        //push scores for one tab in icon group
        simScores.push(row);
    }

    var output = [];
    output = dfs(simScores, tabs);
    return output;
}

function dfs(graph,tabs){
    var threshold = 0.7;
    let s = [];
    let explored = new Set();
    var output = [];
    s.push(0);

    // Mark the first node as explored
    explored.add(0);

    // We'll continue till our Stack gets empty
    while (s.length != 0) {
        let t = s.pop();
        output.push(tabs[t]);
        // Log every element that comes out of the Stack
        //console.log(t);
        
        // to sort 
        for (var i = 0; i < graph[t].length; i++){
            if(i!=t && !explored.has(i) && graph[t][i]< threshold){
                explored.add(i);
                s.push(i);
            }
        }
        for (var i = 0; i < graph[t].length; i++) {
            if (i!=t && !explored.has(i) && graph[t][i] >= threshold) {
                explored.add(i);
                s.push(i);
            }
        }  
        
    }
    return output;
}

function jaccardSimilarity(p, q){
    var setA = new Set (p.split(" "));
    var setB = new Set (q.split(" "));
    const setIntersection = (a, b) => new Set([...a].filter(x => b.has(x)));
    const setUnion = (a, b) => new Set([...a, ...b]);
    return setIntersection(setA, setB).size/setUnion(setA,setB).size;
}


