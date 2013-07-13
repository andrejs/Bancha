/*!
 *
 * Bancha Project : Seamlessly integrates CakePHP with ExtJS and Sencha Touch (http://banchaproject.org)
 * Copyright 2011-2013 codeQ e.U.
 *
 * Tests for the bancha model
 *
 * @copyright     Copyright 2011-2013 codeQ e.U.
 * @link          http://banchaproject.org Bancha Project
 * @author        Roland Schuetz <mail@rolandschuetz.at>
 * @version       Bancha v PRECOMPILER_ADD_RELEASE_VERSION
 *
 * For more information go to http://banchaproject.org
 */
/*jslint browser: true, vars: true, undef: true, nomen: true, eqeq: false, plusplus: true, bitwise: true, regexp: true, newcap: true, sloppy: true, white: true */
/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, immed:true, latedef:true, newcap:true, noarg:true, noempty:true, regexp:true, undef:true, trailing:false */
/*global Ext, Bancha, describe, it, beforeEach, expect, jasmine, spyOn, Mock, ExtSpecHelper, BanchaSpecHelper */

describe("Bancha.data.Model tests", function() {
    var rs = BanchaSpecHelper.SampleData.remoteApiDefinition, // remote sample
        h = BanchaSpecHelper; // helper shortcut

    beforeEach(h.reset);

    it("should apply the cake schema to all Bancha models defined in the Bancha.model namespace", function() {
        
        // expect the apply function to be called
        var spy = spyOn(Ext.ClassManager.get('Bancha.data.Model'), 'applyCakeSchema');

        // ExtJS handles this by simply beeing registered the onClassExtended
        // Sencha Touch recognizes this via the namespace
        Ext.define('Bancha.model.ModelTestCreateUser1', {extend: 'Bancha.data.Model'});
        expect(spy.callCount).toEqual(1);
        Ext.define('Bancha.model.ModelTestCreateUser2', {extend: 'Bancha.data.Model'});
        expect(spy.callCount).toEqual(2);
        Ext.define('MyApp.model.ModelTestCreateUser2', {extend: 'Ext.data.Model'});
        expect(spy.callCount).toEqual(2);
        Bancha.modelNamespace = 'Lala.model';
        Ext.define('Lala.model.ModelTestCreateUser3', {extend: 'Bancha.data.Model'});
        expect(spy.callCount).toEqual(3);
    });


    it("should set a Bancha proxy on subclass models (integrative test)", function() {
        // setup model metadata
        h.init('ModelTestSchema1');

        // and create the model
        Ext.define('Bancha.model.ModelTestSchema1', {
            extend: 'Bancha.data.Model'
        });

        // check if the model really got created
        var model = Ext.ClassManager.get('Bancha.model.ModelTestSchema1');
        expect(model).toBeModelClass('Bancha.model.ModelTestSchema1');

        // test that a correct proxy is set
        expect(model.getProxy()).property('type').toEqual('direct');
        expect(model.getProxy()).property('reader.type').toEqual('json');
        expect(model.getProxy()).property('writer.type').toEqual('jsondate');
    });


    it("should behave like a normal model, check normal model behavior", function() {
        // Since the behavior of Ext JS model changes between release this one jsut makes sure
        // that a normal model would behave as expected
        // This tests our assumptions about the behavior of the current Ext JS/sencha Touch-
        // But no Bancha code

        // create a model with all the configs the Bancha model should have as well
        Ext.define('Bancha.model.ModelTestSchema_PreTest', Ext.applyIf({
            extend: 'Ext.data.Model',
            idProperty: 'login', // <-- for testing the idProperty value
            validations: [
                { type:"numberformat", field:"id", precision:0},
                { type:"presence",     field:"name"},
                { type:"length",       field:'name', min: 2},
                { type:"length",       field:"name", max:64},
                { type:"format",       field:"login", matcher:/^[a-zA-Z0-9_]+$/} // <-- Bancha validation rules use matcher:'banchaAlphanum'
            ],
            getFields: function() { // legacy support for Ext JS 4.0, should be added by Bancha.data.Model as well
                return this.fields.items;
            }
        }, BanchaSpecHelper.SampleData.remoteApiDefinition.metadata.User));

        // Create a test record
        var rec = Ext.create('Bancha.model.ModelTestSchema_PreTest', {
            id: 23,
            login: 'bad-sign',
            name: 'Micky Mouse'
        });

        // expect a getFields method and the value should be an array of fields
        expect(rec.getFields().length).toEqual(8);
        expect(rec.getFields()).property('0.name').toEqual('id');
        expect(rec.getFields()).property('1.name').toEqual('name');
        expect(rec.getFields()).property('2.name').toEqual('login');

        // expect the idProperty to be set on the model prototype
        expect(rec.idProperty).toEqual('login');

        // expect the validation rules to be applied using a validate method
        expect(rec.validate().getCount()).toEqual(1);
        rec.set('login', 'mickymouse');
        expect(rec.validate().getCount()).toEqual(0);

        // the associations are invisible till the associated models are 
        // loaded as well
        h.initAssociatedModels();

        // expect the associations to be set on the model prototype 
        // and the value as a mixed collection
        expect(rec.associations.getCount()).toEqual(2);

        // expect that associations create a store of related data
        expect(rec.posts().isStore).toEqual(true);
        expect(rec.posts().model.getName()).toEqual('Bancha.test.model.Post');
    });


    it("should set the fields and idProperty on Bancha models (integrative test)", function() {
        // setup model metadata
        h.init('ModelTestSchema2');

        // use a non-default id property
        Bancha.getRemoteApi().metadata.ModelTestSchema2.idProperty = 'login';

        // and create the model
        Ext.define('Bancha.model.ModelTestSchema2', {
            extend: 'Bancha.data.Model'
        });

        // Test that a record can be created without errors
        var rec = Ext.create('Bancha.model.ModelTestSchema2', {
            id: 23,
            login: 'mickymouse',
            name: 'Micky Mouse'
        });

        // test that the fields are set correctly
        expect(rec.getFields().length).toEqual(8);
        expect(rec.getFields()).property('0.name').toEqual('id');
        expect(rec.getFields()).property('1.name').toEqual('name');
        expect(rec.getFields()).property('2.name').toEqual('login');

        // test that the id property is set correctly
        expect(rec.idProperty).toEqual('login');
    });


    it("should set the validation rules on Bancha models (integrative test)", function() {
        // setup model metadata
        h.init('ModelTestSchema3');

        // and create the model
        Ext.define('Bancha.model.ModelTestSchema3', {
            extend: 'Bancha.data.Model'
        });

        // create a test record for validating
        var rec = Ext.create('Bancha.model.ModelTestSchema3', {
            id: 'a', // validation error, because not numeric
            login: 'mickymouse' // this is fine
            // name: validation error, because not present
        });

        // test that the validation rules are applied
        expect(rec.validate().getCount()).toEqual(2);
        rec.set('login', 'bad-sign');
        expect(rec.validate().getCount()).toEqual(3);

        // create a test record for validating
        rec = Ext.create('Bancha.model.ModelTestSchema3', {
            id: 23,
            login: 'mickymouse',
            name: 'Micky Mouse'
        });

        // test that the validation rules are applied
        expect(rec.validate().getCount()).toEqual(0);
    });


    it("should set the associations on Bancha models (integrative test)", function() {
        // setup model metadata
        h.init('ModelTestSchema4');

        // and create the model
        Ext.define('Bancha.model.ModelTestSchema4', {
            extend: 'Bancha.data.Model'
        });

        // create a test record
        var rec = Ext.create('Bancha.model.ModelTestSchema4', {
            id: 23,
            login: 'mickymouse',
            name: 'Micky Mouse'
        });

        // the associations are invisible till the associated models are 
        // loaded as well
        h.initAssociatedModels();

        // expect that Bancha set the associations
        expect(rec.associations.getCount()).toEqual(2);

        // expect that associations create a store of related data
        expect(rec.posts().isStore).toEqual(true);
        expect(rec.posts().model.getName()).toEqual('Bancha.test.model.Post');
    });


    it("should handle this simple integration test", function() {
        // setup model metadata
        h.init('ModelTestSchema4');

        // and create the model
        Ext.define('Bancha.model.ModelTestSchema4', {
            extend: 'Bancha.data.Model'
        });

        // check if the model really got created
        var model = Ext.ClassManager.get('Bancha.model.ModelTestSchema4');
        expect(model).toBeModelClass('Bancha.model.ModelTestSchema4');


        // create a mock object for the proxy
        var mockProxy = Mock.Proxy();
        model.setProxy(mockProxy);

        // Test 1:
        // create a test record
        var rec = Ext.create('Bancha.model.ModelTestSchema4', {
            login: 'mickymouse',
            name: 'Micky Mouse'
        });

        // define expectations for remote stub calls
        // user.save() should result in one create action
        mockProxy.expect("create");

        // test
        rec.save();
        
        // verify the expectations were met
        // TODO Not yet working in touch: http://www.sencha.com/forum/showthread.php?188764-How-to-mock-a-proxy
        if(ExtSpecHelper.isExt) {
            mockProxy.verify();
        }

        // Test 2:
        // create a test record
        rec = Ext.create('Bancha.model.ModelTestSchema4', {
            id: 23, // record already exists
            login: 'mickymouse',
            name: 'Micky Mouse'
        });

        // define expectations for remote stub calls
        // user.save() should result in one create action
        mockProxy.expect("update");

        // test
        rec.save();
        
        // verify the expectations were met
        // TODO Not yet working in touch: http://www.sencha.com/forum/showthread.php?188764-How-to-mock-a-proxy
        if(ExtSpecHelper.isExt) {
            mockProxy.verify();
        }
    });

});

//eof
