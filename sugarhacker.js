(function(){
    function initFailed (msg){
        alert("Failed to load Sugarhacker. Reason: " + msg);
    }

    function getActiveStateVariables(){
        var state = SugarCube.State || SugarCube.state;
        return state.active.variables;
    }

    var updateDOMValues = true;
    var updateDOMValuesInterval = 0;

    function trackChanges(oldVariablesJson){
        var newVariables = getActiveStateVariables();
        var newVariablesJson = JSON.stringify(newVariables);

        if(typeof oldVariablesJson !== "undefined") {
            if(oldVariablesJson !== newVariablesJson) {
                var diffs = findObjDiff(JSON.parse(oldVariablesJson), JSON.parse(newVariablesJson));
                var diffKeys = Object.keys(diffs);
                if(diffKeys.length > 0){

                    var allInputs = document.querySelectorAll('.var-input');
                    for(var i = 0; i < allInputs.length; i++) {
                        allInputs[i].classList.remove('value-changed');
                    }

                    for(var i = 0; i < diffKeys.length; i++) {
                        var diffKey = diffKeys[i];
                        var diffVal = diffs[diffKey];
                        console.log(diffKey, diffVal);

                        if(updateDOMValues) {
                            var inputElement = document.querySelector('.Gamestate.' + diffKey);
                            if(inputElement) {
                                inputElement.value = diffVal.newVal;
                                inputElement.classList.add('value-changed');
                            }
                        }
                    }
                }
            }
        }

        setTimeout(function(){
            trackChanges(newVariablesJson);
        }, 250);
    }

    var objectToDOM = (function(){

        function objectToDOM(obj, key, ref){
            var _parent = document.createElement('div');
            _parent.classList.add('var-field');
            _parent.classList.add('var-type-object');
            _parent.addEventListener('click', function(e){
                _parent.classList.toggle('properties-open');
                e.stopPropagation();
            });

            var _title = document.createElement('span');
            _title.classList.add('var-title');
            _title.innerText = key;

            var _propertyContainer = document.createElement('div');
            _propertyContainer.classList.add('var-properties');
            _propertyContainer.addEventListener('click', function(e){
                e.stopPropagation();
            });

            _parent.appendChild(_title);
            _parent.appendChild(_propertyContainer);

            function childPropertyChangeHandler(e){
                e.stopPropagation();

                var value = e.detail.value;
                var childKey = key + "." + e.detail.key;
                var event = new CustomEvent('propertyChange', { detail: {key: childKey, value: value }});
                _parent.dispatchEvent(event);
            }

            for(var propKey in obj){
                var property = obj[propKey];
                var propRef = ref + "." + propKey;
                var _child = propertyToDOM(property, propKey, propRef);
                if(typeof _child !== "undefined") {
                    _propertyContainer.appendChild(_child);
                    _child.addEventListener('propertyChange', childPropertyChangeHandler);
                }
            }

            return _parent;
        }

        function numberToDOM(num, key, ref){
            var _parent = document.createElement('div');
            _parent.classList.add('var-field');
            _parent.classList.add('var-type-number');

            var _title = document.createElement('span');
            _title.classList.add('var-title');
            _title.innerText = key;

            var _input = document.createElement('input');
            _input.classList.add('var-input');
            _input.setAttribute('type', 'number');
            _input.value = num;

            var refArr = ref.split(".");
            for(var k in refArr){
                _input.classList.add(refArr[k]);
            }

            _parent.appendChild(_title);
            _parent.appendChild(_input);

            function inputHandler(e){
                e.stopPropagation();

                var value = parseFloat(_input.value);
                var event = new CustomEvent('propertyChange', { detail: {key: key, value: value }, bubbles: true});
                _input.dispatchEvent(event);
            }
            _input.addEventListener('keyup', inputHandler);
            _input.addEventListener('change', inputHandler);


            return _parent;

        }

        function stringToDOM(str, key, ref){
            var _parent = document.createElement('div');
            _parent.classList.add('var-field');
            _parent.classList.add('var-type-text');

            var _title = document.createElement('span');
            _title.classList.add('var-title');
            _title.innerText = key;

            var _input = document.createElement('input');
            _input.classList.add('var-input');
            _input.setAttribute('type', 'text');
            _input.value = str;

            var refArr = ref.split(".");
            for(var k in refArr){
                _input.classList.add(refArr[k]);
            }

            _parent.appendChild(_title);
            _parent.appendChild(_input);

            function inputHandler(e){
                e.stopPropagation();
                var event = new CustomEvent('propertyChange', { detail: {key: key, value: _input.value }});
                _input.dispatchEvent(event);
            }
            _input.addEventListener('keyup', inputHandler);
            _input.addEventListener('change', inputHandler);

            return _parent;

        }

        function propertyToDOM(property, key, ref){
            if(typeof property === "object") return objectToDOM(property, key, ref);
            else if(typeof property === "number") return numberToDOM(property, key, ref);
            else if(typeof property === "string") return stringToDOM(property, key, ref);
        }

        return objectToDOM;
    })();

    function findObjDiff(oldObj, newObj, prefix){
        var changes = {};
        if(typeof prefix !== "string") prefix = "";
        for(var k in newObj) {
            var key = prefix + k;
            if(typeof oldObj[k] === "undefined") {
                changes[key] = { newVal: newObj[k] };
            }
            else {
                var newVal = newObj[k];
                var t = typeof(newVal);
                if(t === "object") {
                    var childChanges = findObjDiff(oldObj[k], newObj[k], prefix + k + ".");
                    for(var ck in childChanges) {
                        changes[ck] = childChanges[ck];
                    }
                }
                else{
                    var oldVal = oldObj[k];
                    if(oldVal !== newVal) {
                        changes[key] = { oldVal: oldVal, newVal: newVal };
                    }
                }
            }
        }
        return changes;
    }

    if(typeof SugarCube === "undefined") initFailed("SugarCube not found");
    else {
        var state = SugarCube.state || SugarCube.State;
        if(typeof state === "undefined") initFailed("State not found");
        else {
            trackChanges();

            var _stateContainer = document.createElement('div');
            _stateContainer.setAttribute('id', 'VarStateContainer');

            var gameStateDOM = objectToDOM(state.active.variables, "Gamestate", "Gamestate");
            _stateContainer.appendChild(gameStateDOM);
            gameStateDOM.addEventListener('propertyChange', function(e){
                var parentObj = getActiveStateVariables();
                var keyArr = e.detail.key.split('.');
                // Navigate to nearest parent object
                for(var i = 1; i < (keyArr.length - 1); i++) {
                    parentObj = parentObj[keyArr[i]];
                }
                // Temporarily disable DOM updating
                updateDOMValues = false;
                clearTimeout(updateDOMValuesInterval);
                updateDOMValuesInterval = setTimeout(function(){ updateDOMValues = true; }, 250);
                // Set variable

                parentObj[keyArr[keyArr.length - 1]] = e.detail.value;
            });

            document.querySelector('body').appendChild(_stateContainer);
        }
    }
})();