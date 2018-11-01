Element.prototype.removeClass = function(name) {
    this.className = this.className.split(' ').filter(function(val) {return [name,' '].indexOf(val) < 0;}).join(' ').trim();
    return this;
}

Element.prototype.addClass = function(name) {
    var classes = this.className.split(' ').filter(function(val) {return [name,' '].indexOf(val) < 0;});
    classes.push(name);
    this.className = classes.join(' ').trim();
    return this;
};

if (!window.localStorage) {
    window.localStorage = {
        items: {},
        setItem: function(k,v) {
            this.items[k] = v;
        },
        getItem: function(k) {
            return this.items[k] || null;
        },
        clear: function() {
            this.items = {};
        }
    };
}

var s = {
    config: {
        pdf: {
            base_url: 'https://www3.epa.gov/pesticides/chem_search/ppls/'
        },
        elements: {
            form: document.getElementById('search-form'),
            search: document.getElementById('search'),
            endpoint: document.getElementById('endpoint'),
            fields: document.getElementById('fields'),
            output: document.getElementById('output'),
        },
    },
    each: function(data, callback) {
        for (var k in data || {}) {
            if (data && data.constructor && data.constructor == Array || data.hasOwnProperty(k)) callback(k, data[k]);
        }
    },
    loading: function(load) {
        this.config.elements.form[load ? 'addClass' : 'removeClass']('loading');
        this.each(this.config.elements.form.elements, function(key, el) {
            el[load ? 'addClass' : 'removeClass']('loading');
            el.disabled = load;
        });
    },
    request: function(url, type, callback) {
        var self = this;
        self.loading(1);

        var req = new XMLHttpRequest();
        req.onreadystatechange = function() { 
            if (req.readyState == 4 && req.status == 200) {
                self.loading(0);
                callback(req.responseText);
            }
        }
        req.open(type || 'GET', url, true);
        req.send();
    },
    extract: function(obj, path, def) {
        path = path.split('.');
        while (obj && path.length) { obj = obj[path.shift()] || null; }
        return obj || def;
    },
    getUrl: function(str) {
        return this.config.elements.endpoint.value.replace('\<search\>', this.config.elements.search.value);
    },
    getFields: function(fields) {
        fields = {};
        for (var i=0; i < this.config.elements.fields.length; i++) {
            if (this.config.elements.fields[i].selected) {
                fields[this.config.elements.fields[i].value] = this.config.elements.fields[i].label;
            }
        }
        return fields;
    },
    clear: function() {
        this.config.elements.output.innerHTML = '';
    },
    report: function(data) {
        this.clear();
        var item;

        for (var i in data) {
            // Heading
            var heading = document.createElement('div');
            heading.innerText = 'Item ' + i;
            this.config.elements.output.appendChild(heading);

            item = data[i];

            var ul = document.createElement('ul');
            for (var x in item) {
                var li = document.createElement('li'),
                    strong = document.createElement('strong');
                strong.innerText = x + ': ';
                li.innerText = item[x];
                li.prepend(strong);
                ul.appendChild(li);
            }
            this.config.elements.output.appendChild(ul);
        }
    },
    getHashKey: function() {
        return this.config.elements.endpoint.selectedIndex + '.' + this.config.elements.search.value;
    },
    display: function(res) {
        try {
            var data = JSON.parse(res);
        } catch (e) {
            return console.error(e);
        }

        if (data && data.items) {
            window.localStorage.setItem(this.getHashKey(), res);

            var fields = this.getFields(),
                items = [];

            for (var i in data.items) {
                var item = {};
                for (var x in fields) {
                    item[fields[x]] = this.extract(data.items[i], x);
                }
                items.push(item);
            }

            this.report(items);
        }
    },
    submit: function(e) {
        e.preventDefault();
        if (!this.config.elements.search.value) {
            alert('Please enter search term...');
            return;
        }

        var data = window.localStorage.getItem(this.getHashKey());
        if (data) return this.display(data);
        this.request(this.getUrl(), null, this.display.bind(this));
    },
    init: function() {
        this.config.elements.form.onsubmit = this.submit.bind(this);
    }
};

s.init();
