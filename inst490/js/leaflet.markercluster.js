/*
 Copyright (c) 2012, Smartrak, David Leaver
 Leaflet.markercluster is an open-source JavaScript library for Marker Clustering on leaflet powered maps.
 https://github.com/danzel/Leaflet.markercluster
*/
(function () {
	L.MarkerClusterGroup = L.FeatureGroup.extend({
			options: {
				maxClusterRadius: 80,
				iconCreateFunction: null,
				spiderfyOnMaxZoom: !0,
				showCoverageOnHover: !0,
				zoomToBoundsOnClick: !0,
				singleMarkerMode: !1,
				disableClusteringAtZoom: null,
				removeOutsideVisibleBounds: !0,
				animateAddingMarkers: !1,
				spiderfyDistanceMultiplier: 1,
				polygonOptions: {}
			},
			initialize: function (t) {
				L.Util.setOptions(this, t),
					this.options.iconCreateFunction || (this.options.iconCreateFunction = this._defaultIconCreateFunction),
					L.FeatureGroup.prototype.initialize.call(this, []),
					this._inZoomAnimation = 0, this._needsClustering = [],
					this._currentShownBounds = null
			},
			addLayer: function (t) {
				if (t instanceof L.LayerGroup) {
					var e = [];
					for (var i in t._layers)
						e.push(t._layers[i]);
					return this.addLayers(e)
				}
				if (!this._map)
					return this._needsClustering.push(t),
						this;
				if (this.hasLayer(t))
					return this;
				this._unspiderfy && this._unspiderfy(), this._addLayer(t, this._maxZoom);
				var n = t,
					r = this._map.getZoom();
				if (t.__parent)
					for (; n.__parent._zoom >= r;) n = n.__parent;
				return this._currentShownBounds.contains(n.getLatLng()) && (this.options.animateAddingMarkers ? this._animationAddLayer(t, n) : this._animationAddLayerNonAnimated(t, n)), this
			},
			removeLayer: function (t) {
				return this._map ? t.__parent ? (this._unspiderfy && (this._unspiderfy(), this._unspiderfyLayer(t)), this._removeLayer(t, !0), t._icon && (L.FeatureGroup.prototype.removeLayer.call(this, t), t.setOpacity(1)), this) : this : (this._arraySplice(this._needsClustering, t), this)
			},
			addLayers: function (t) {
				var e, i, n;
				if (!this._map) return this._needsClustering = this._needsClustering.concat(t), this;
				for (e = 0, i = t.length; i > e; e++)
					if (n = t[e], !this.hasLayer(n) && (this._addLayer(n, this._maxZoom), n.__parent && 2 === n.__parent.getChildCount())) {
						var r = n.__parent.getAllChildMarkers(),
							s = r[0] === n ? r[1] : r[0];
						L.FeatureGroup.prototype.removeLayer.call(this, s)
					}
				for (e in this._layers) n = this._layers[e], n instanceof L.MarkerCluster && n._iconNeedsUpdate && n._updateIcon();
				return this._topClusterLevel._recursivelyAddChildrenToMap(null, this._zoom, this._currentShownBounds), this
			},
			removeLayers: function (t) {
				var e, i, n;
				if (!this._map) {
					for (e = 0, i = t.length; i > e; e++) this._arraySplice(this._needsClustering, t[e]);
					return this
				}
				for (e = 0, i = t.length; i > e; e++) n = t[e], n.__parent && (this._removeLayer(n, !0, !0), n._icon && (L.FeatureGroup.prototype.removeLayer.call(this, n), n.setOpacity(1)));
				this._topClusterLevel._recursivelyAddChildrenToMap(null, this._zoom, this._currentShownBounds);
				for (e in this._layers) n = this._layers[e], n instanceof L.MarkerCluster && n._updateIcon();
				return this
			},
			clearLayers: function () {
				this._map || (this._needsClustering = [], delete this._gridClusters, delete this._gridUnclustered), this._noanimationUnspiderfy && this._noanimationUnspiderfy();
				for (var t in this._layers) L.FeatureGroup.prototype.removeLayer.call(this, this._layers[t]);
				return this.eachLayer(function (t) {
					delete t.__parent
				}), this._map && this._generateInitialClusters(), this
			},
			getBounds: function () {
				var t = new L.LatLngBounds;
				if (this._topClusterLevel) t.extend(this._topClusterLevel._bounds);
				else
					for (var e = this._needsClustering.length - 1; e >= 0; e--) t.extend(this._needsClustering[e].getLatLng());
				return t
			},
			eachLayer: function (t, e) {
				var i, n = this._needsClustering.slice();
				for (this._topClusterLevel && this._topClusterLevel.getAllChildMarkers(n), i = n.length - 1; i >= 0; i--) t.call(e, n[i])
			},
			hasLayer: function (t) {
				if (t._noHas) return !1;
				if (this._needsClustering.length > 0)
					for (var e = this._needsClustering, i = e.length - 1; i >= 0; i--)
						if (e[i] === t) return !0;
				return !(!t.__parent || t.__parent._group !== this)
			},
			zoomToShowLayer: function (t, e) {
				var i = function () {
					if ((t._icon || t.__parent._icon) && !this._inZoomAnimation)
						if (this._map.off("moveend", i, this), this.off("animationend", i, this), t._icon) e();
						else if (t.__parent._icon) {
						var n = function () {
							this.off("spiderfied", n, this), e()
						};
						this.on("spiderfied", n, this), t.__parent.spiderfy()
					}
				};
				t._icon ? e() : t.__parent._zoom < this._map.getZoom() ? (this._map.on("moveend", i, this), t._icon || this._map.panTo(t.getLatLng())) : (this._map.on("moveend", i, this), this.on("animationend", i, this), this._map.setView(t.getLatLng(), t.__parent._zoom + 1), t.__parent.zoomToBounds())
			},
			onAdd: function (t) {
				this._map = t, this._gridClusters || this._generateInitialClusters();
				for (var e = 0, i = this._needsClustering.length; i > e; e++) {
					var n = this._needsClustering[e];
					n.__parent || this._addLayer(n, this._maxZoom)
				}
				this._needsClustering = [], this._map.on("zoomend", this._zoomEnd, this), this._map.on("moveend", this._moveEnd, this), this._spiderfierOnAdd && this._spiderfierOnAdd(), this._bindEvents(), this._zoom = this._map.getZoom(), this._currentShownBounds = this._getExpandedVisibleBounds(), this._topClusterLevel._recursivelyAddChildrenToMap(null, this._zoom, this._currentShownBounds)
			},
			onRemove: function (t) {
				t.off("zoomend", this._zoomEnd, this), t.off("moveend", this._moveEnd, this), this._unbindEvents(), this._map._mapPane.className = this._map._mapPane.className.replace(" leaflet-cluster-anim", ""), this._spiderfierOnRemove && this._spiderfierOnRemove();
				for (var e in this._layers) L.FeatureGroup.prototype.removeLayer.call(this, this._layers[e]);
				this._map = null
			},
			_arraySplice: function (t, e) {
				for (var i = t.length - 1; i >= 0; i--)
					if (t[i] === e) return t.splice(i, 1), void 0
			},
			_removeLayer: function (t, e, i) {
				var n = this._gridClusters,
					r = this._gridUnclustered,
					s = this._map;
				if (e)
					for (var o = this._maxZoom; o >= 0 && r[o].removeObject(t, s.project(t.getLatLng(), o)); o--);
				var a, l = t.__parent,
					_ = l._markers;
				for (this._arraySplice(_, t); l && (l._childCount--, !(0 > l._zoom));) e && 1 >= l._childCount ? (a = l._markers[0] === t ? l._markers[1] : l._markers[0], n[l._zoom].removeObject(l, s.project(l._cLatLng, l._zoom)), r[l._zoom].addObject(a, s.project(a.getLatLng(), l._zoom)), this._arraySplice(l.__parent._childClusters, l), l.__parent._markers.push(a), a.__parent = l.__parent, l._icon && (L.FeatureGroup.prototype.removeLayer.call(this, l), i || L.FeatureGroup.prototype.addLayer.call(this, a))) : (l._recalculateBounds(), i && l._icon || l._updateIcon()), l = l.__parent;
				delete t.__parent
			},
			_propagateEvent: function (t) {
				t.target instanceof L.MarkerCluster && (t.type = "cluster" + t.type), L.FeatureGroup.prototype._propagateEvent.call(this, t)
			},
			_defaultIconCreateFunction: function (t) {
				var e = t.getChildCount(),
					i = " marker-cluster-";
				return i += 10 > e ? "small" : 100 > e ? "medium" : "large", new L.DivIcon({
					html: "<div><span>" + e + "</span></div>",
					className: "marker-cluster" + i,
					iconSize: new L.Point(40, 40)
				})
			},
			_bindEvents: function () {
				var t = null,
					e = this._map,
					i = this.options.spiderfyOnMaxZoom,
					n = this.options.showCoverageOnHover,
					r = this.options.zoomToBoundsOnClick;
				(i || r) && this.on("clusterclick", function (t) {
					e.getMaxZoom() === e.getZoom() ? i && t.layer.spiderfy() : r && t.layer.zoomToBounds()
				}, this), n && (this.on("clustermouseover", function (i) {
					this._inZoomAnimation || (t && e.removeLayer(t), i.layer.getChildCount() > 2 && i.layer !== this._spiderfied && (t = new L.Polygon(i.layer.getConvexHull(), this.options.polygonOptions), e.addLayer(t)))
				}, this), this.on("clustermouseout", function () {
					t && (e.removeLayer(t), t = null)
				}, this), e.on("zoomend", function () {
					t && (e.removeLayer(t), t = null)
				}, this), e.on("layerremove", function (i) {
					t && i.layer === this && (e.removeLayer(t), t = null)
				}, this))
			},
			_unbindEvents: function () {
				var t = this.options.spiderfyOnMaxZoom,
					e = this.options.showCoverageOnHover,
					i = this.options.zoomToBoundsOnClick,
					n = this._map;
				(t || i) && this.off("clusterclick", null, this), e && (this.off("clustermouseover", null, this), this.off("clustermouseout", null, this), n.off("zoomend", null, this), n.off("layerremove", null, this))
			},
			_zoomEnd: function () {
				this._map && (this._mergeSplitClusters(), this._zoom = this._map._zoom, this._currentShownBounds = this._getExpandedVisibleBounds())
			},
			_moveEnd: function () {
				if (!this._inZoomAnimation) {
					var t = this._getExpandedVisibleBounds();
					this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, this._zoom, t), this._topClusterLevel._recursivelyAddChildrenToMap(null, this._zoom, t), this._currentShownBounds = t
				}
			},
			_generateInitialClusters: function () {
				var t = this._map.getMaxZoom(),
					e = this.options.maxClusterRadius;
				this.options.disableClusteringAtZoom && (t = this.options.disableClusteringAtZoom - 1), this._maxZoom = t, this._gridClusters = {}, this._gridUnclustered = {};
				for (var i = t; i >= 0; i--) this._gridClusters[i] = new L.DistanceGrid(e), this._gridUnclustered[i] = new L.DistanceGrid(e);
				this._topClusterLevel = new L.MarkerCluster(this, -1)
			},
			_addLayer: function (t, e) {
				var i, n, r = this._gridClusters,
					s = this._gridUnclustered;
				for (this.options.singleMarkerMode && (t.options.icon = this.options.iconCreateFunction({
						getChildCount: function () {
							return 1
						},
						getAllChildMarkers: function () {
							return [t]
						}
					})); e >= 0; e--) {
					i = this._map.project(t.getLatLng(), e);
					var o = r[e].getNearObject(i);
					if (o) return o._addChild(t), t.__parent = o, void 0;
					if (o = s[e].getNearObject(i)) {
						var a = o.__parent;
						a && this._removeLayer(o, !1);
						var l = new L.MarkerCluster(this, e, o, t);
						r[e].addObject(l, this._map.project(l._cLatLng, e)), o.__parent = l, t.__parent = l;
						var _ = l;
						for (n = e - 1; n > a._zoom; n--) _ = new L.MarkerCluster(this, n, _), r[n].addObject(_, this._map.project(o.getLatLng(), n));
						for (a._addChild(_), n = e; n >= 0 && s[n].removeObject(o, this._map.project(o.getLatLng(), n)); n--);
						return
					}
					s[e].addObject(t, i)
				}
				this._topClusterLevel._addChild(t), t.__parent = this._topClusterLevel
			},
			_mergeSplitClusters: function () {
				this._zoom < this._map._zoom ? (this._animationStart(), this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, this._zoom, this._getExpandedVisibleBounds()), this._animationZoomIn(this._zoom, this._map._zoom)) : this._zoom > this._map._zoom ? (this._animationStart(), this._animationZoomOut(this._zoom, this._map._zoom)) : this._moveEnd()
			},
			_getExpandedVisibleBounds: function () {
				if (!this.options.removeOutsideVisibleBounds) return this.getBounds();
				var t = this._map,
					e = t.getBounds(),
					i = e._southWest,
					n = e._northEast,
					r = L.Browser.mobile ? 0 : Math.abs(i.lat - n.lat),
					s = L.Browser.mobile ? 0 : Math.abs(i.lng - n.lng);
				return new L.LatLngBounds(new L.LatLng(i.lat - r, i.lng - s, !0), new L.LatLng(n.lat + r, n.lng + s, !0))
			},
			_animationAddLayerNonAnimated: function (t, e) {
				if (e === t) L.FeatureGroup.prototype.addLayer.call(this, t);
				else if (2 === e._childCount) {
					e._addToMap();
					var i = e.getAllChildMarkers();
					L.FeatureGroup.prototype.removeLayer.call(this, i[0]), L.FeatureGroup.prototype.removeLayer.call(this, i[1])
				} else e._updateIcon()
			}
		}), L.MarkerClusterGroup.include(L.DomUtil.TRANSITION ? {
			_animationStart: function () {
				this._map._mapPane.className += " leaflet-cluster-anim", this._inZoomAnimation++
			},
			_animationEnd: function () {
				this._map && (this._map._mapPane.className = this._map._mapPane.className.replace(" leaflet-cluster-anim", "")), this._inZoomAnimation--, this.fire("animationend")
			},
			_animationZoomIn: function (t, e) {
				var i, n = this,
					r = this._getExpandedVisibleBounds();
				this._topClusterLevel._recursively(r, t, 0, function (s) {
					var o, a = s._latlng,
						l = s._markers;
					for (s._isSingleParent() && t + 1 === e ? (L.FeatureGroup.prototype.removeLayer.call(n, s), s._recursivelyAddChildrenToMap(null, e, r)) : (s.setOpacity(0), s._recursivelyAddChildrenToMap(a, e, r)), i = l.length - 1; i >= 0; i--) o = l[i], r.contains(o._latlng) || L.FeatureGroup.prototype.removeLayer.call(n, o)
				}), this._forceLayout();
				var s, o;
				n._topClusterLevel._recursivelyBecomeVisible(r, e);
				for (s in n._layers) o = n._layers[s], o instanceof L.MarkerCluster || !o._icon || o.setOpacity(1);
				n._topClusterLevel._recursively(r, t, e, function (t) {
					t._recursivelyRestoreChildPositions(e)
				}), setTimeout(function () {
					n._topClusterLevel._recursively(r, t, 0, function (t) {
						L.FeatureGroup.prototype.removeLayer.call(n, t), t.setOpacity(1)
					}), n._animationEnd()
				}, 200)
			},
			_animationZoomOut: function (t, e) {
				this._animationZoomOutSingle(this._topClusterLevel, t - 1, e), this._topClusterLevel._recursivelyAddChildrenToMap(null, e, this._getExpandedVisibleBounds()), this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, t, this._getExpandedVisibleBounds())
			},
			_animationZoomOutSingle: function (t, e, i) {
				var n = this._getExpandedVisibleBounds();
				t._recursivelyAnimateChildrenInAndAddSelfToMap(n, e + 1, i);
				var r = this;
				this._forceLayout(), t._recursivelyBecomeVisible(n, i), setTimeout(function () {
					if (1 === t._childCount) {
						var s = t._markers[0];
						s.setLatLng(s.getLatLng()), s.setOpacity(1)
					} else t._recursively(n, i, 0, function (t) {
						t._recursivelyRemoveChildrenFromMap(n, e + 1)
					});
					r._animationEnd()
				}, 200)
			},
			_animationAddLayer: function (t, e) {
				var i = this;
				L.FeatureGroup.prototype.addLayer.call(this, t), e !== t && (e._childCount > 2 ? (e._updateIcon(), this._forceLayout(), this._animationStart(), t._setPos(this._map.latLngToLayerPoint(e.getLatLng())), t.setOpacity(0), setTimeout(function () {
					L.FeatureGroup.prototype.removeLayer.call(i, t), t.setOpacity(1), i._animationEnd()
				}, 200)) : (this._forceLayout(), i._animationStart(), i._animationZoomOutSingle(e, this._map.getMaxZoom(), this._map.getZoom())))
			},
			_forceLayout: function () {
				L.Util.falseFn(document.body.offsetWidth)
			}
		} : {
			_animationStart: function () {},
			_animationZoomIn: function (t, e) {
				this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, t), this._topClusterLevel._recursivelyAddChildrenToMap(null, e, this._getExpandedVisibleBounds())
			},
			_animationZoomOut: function (t, e) {
				this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, t), this._topClusterLevel._recursivelyAddChildrenToMap(null, e, this._getExpandedVisibleBounds())
			},
			_animationAddLayer: function (t, e) {
				this._animationAddLayerNonAnimated(t, e)
			}
		}), L.MarkerCluster = L.Marker.extend({
			initialize: function (t, e, i, n) {
				L.Marker.prototype.initialize.call(this, i ? i._cLatLng || i.getLatLng() : new L.LatLng(0, 0), {
					icon: this
				}), this._group = t, this._zoom = e, this._markers = [], this._childClusters = [], this._childCount = 0, this._iconNeedsUpdate = !0, this._bounds = new L.LatLngBounds, i && this._addChild(i), n && this._addChild(n)
			},
			getAllChildMarkers: function (t) {
				t = t || [];
				for (var e = this._childClusters.length - 1; e >= 0; e--) this._childClusters[e].getAllChildMarkers(t);
				for (var i = this._markers.length - 1; i >= 0; i--) t.push(this._markers[i]);
				return t
			},
			getChildCount: function () {
				return this._childCount
			},
			zoomToBounds: function () {
				this._group._map.fitBounds(this._bounds)
			},
			getBounds: function () {
				var t = new L.LatLngBounds;
				return t.extend(this._bounds), t
			},
			_updateIcon: function () {
				this._iconNeedsUpdate = !0, this._icon && this.setIcon(this)
			},
			createIcon: function () {
				return this._iconNeedsUpdate && (this._iconObj = this._group.options.iconCreateFunction(this), this._iconNeedsUpdate = !1), this._iconObj.createIcon()
			},
			createShadow: function () {
				return this._iconObj.createShadow()
			},
			_addChild: function (t, e) {
				this._iconNeedsUpdate = !0, this._expandBounds(t), t instanceof L.MarkerCluster ? (e || (this._childClusters.push(t), t.__parent = this), this._childCount += t._childCount) : (e || this._markers.push(t), this._childCount++), this.__parent && this.__parent._addChild(t, !0)
			},
			_expandBounds: function (t) {
				var e, i = t._wLatLng || t._latlng;
				t instanceof L.MarkerCluster ? (this._bounds.extend(t._bounds), e = t._childCount) : (this._bounds.extend(i), e = 1), this._cLatLng || (this._cLatLng = t._cLatLng || i);
				var n = this._childCount + e;
				this._wLatLng ? (this._wLatLng.lat = (i.lat * e + this._wLatLng.lat * this._childCount) / n, this._wLatLng.lng = (i.lng * e + this._wLatLng.lng * this._childCount) / n) : this._latlng = this._wLatLng = new L.LatLng(i.lat, i.lng)
			},
			_addToMap: function (t) {
				t && (this._backupLatlng = this._latlng, this.setLatLng(t)), this._noHas = !0, L.FeatureGroup.prototype.addLayer.call(this._group, this), delete this._noHas
			},
			_recursivelyAnimateChildrenIn: function (t, e, i) {
				this._recursively(t, 0, i - 1, function (t) {
					var i, n, r = t._markers;
					for (i = r.length - 1; i >= 0; i--) n = r[i], n._icon && (n._setPos(e), n.setOpacity(0))
				}, function (t) {
					var i, n, r = t._childClusters;
					for (i = r.length - 1; i >= 0; i--) n = r[i], n._icon && (n._setPos(e), n.setOpacity(0))
				})
			},
			_recursivelyAnimateChildrenInAndAddSelfToMap: function (t, e, i) {
				this._recursively(t, i, 0, function (n) {
					n._recursivelyAnimateChildrenIn(t, n._group._map.latLngToLayerPoint(n.getLatLng()).round(), e), n._isSingleParent() && e - 1 === i ? (n.setOpacity(1), n._recursivelyRemoveChildrenFromMap(t, e)) : n.setOpacity(0), n._addToMap()
				})
			},
			_recursivelyBecomeVisible: function (t, e) {
				this._recursively(t, 0, e, null, function (t) {
					t.setOpacity(1)
				})
			},
			_recursivelyAddChildrenToMap: function (t, e, i) {
				this._recursively(i, -1, e, function (n) {
					if (e !== n._zoom)
						for (var r = n._markers.length - 1; r >= 0; r--) {
							var s = n._markers[r];
							i.contains(s._latlng) && (t && (s._backupLatlng = s.getLatLng(), s.setLatLng(t), s.setOpacity(0)), s._noHas = !0, L.FeatureGroup.prototype.addLayer.call(n._group, s), delete s._noHas)
						}
				}, function (e) {
					e._addToMap(t)
				})
			},
			_recursivelyRestoreChildPositions: function (t) {
				for (var e = this._markers.length - 1; e >= 0; e--) {
					var i = this._markers[e];
					i._backupLatlng && (i.setLatLng(i._backupLatlng), delete i._backupLatlng)
				}
				if (t - 1 === this._zoom)
					for (var n = this._childClusters.length - 1; n >= 0; n--) this._childClusters[n]._restorePosition();
				else
					for (var r = this._childClusters.length - 1; r >= 0; r--) this._childClusters[r]._recursivelyRestoreChildPositions(t)
			},
			_restorePosition: function () {
				this._backupLatlng && (this.setLatLng(this._backupLatlng), delete this._backupLatlng)
			},
			_recursivelyRemoveChildrenFromMap: function (t, e, i) {
				var n, r;
				this._recursively(t, -1, e - 1, function (t) {
					for (r = t._markers.length - 1; r >= 0; r--) n = t._markers[r], i && i.contains(n._latlng) || (L.FeatureGroup.prototype.removeLayer.call(t._group, n), n.setOpacity(1))
				}, function (t) {
					for (r = t._childClusters.length - 1; r >= 0; r--) n = t._childClusters[r], i && i.contains(n._latlng) || ((!L.FeatureGroup.prototype.hasLayer || L.FeatureGroup.prototype.hasLayer.call(t._group, n)) && L.FeatureGroup.prototype.removeLayer.call(t._group, n), n.setOpacity(1))
				})
			},
			_recursively: function (t, e, i, n, r) {
				var s, o, a = this._childClusters,
					l = this._zoom;
				if (e > l)
					for (s = a.length - 1; s >= 0; s--) o = a[s], t.intersects(o._bounds) && o._recursively(t, e, i, n, r);
				else if (n && n(this), r && this._zoom === i && r(this), i > l)
					for (s = a.length - 1; s >= 0; s--) o = a[s], t.intersects(o._bounds) && o._recursively(t, e, i, n, r)
			},
			_recalculateBounds: function () {
				var t, e = this._markers,
					i = this._childClusters;
				for (this._bounds = new L.LatLngBounds, delete this._wLatLng, t = e.length - 1; t >= 0; t--) this._expandBounds(e[t]);
				for (t = i.length - 1; t >= 0; t--) this._expandBounds(i[t])
			},
			_isSingleParent: function () {
				return this._childClusters.length > 0 && this._childClusters[0]._childCount === this._childCount
			}
		}), L.DistanceGrid = function (t) {
			this._cellSize = t, this._sqCellSize = t * t, this._grid = {}, this._objectPoint = {}
		}, L.DistanceGrid.prototype = {
			addObject: function (t, e) {
				var i = this._getCoord(e.x),
					n = this._getCoord(e.y),
					r = this._grid,
					s = r[n] = r[n] || {},
					o = s[i] = s[i] || [],
					a = L.Util.stamp(t);
				this._objectPoint[a] = e, o.push(t)
			},
			updateObject: function (t, e) {
				this.removeObject(t), this.addObject(t, e)
			},
			removeObject: function (t, e) {
				var i, n, r = this._getCoord(e.x),
					s = this._getCoord(e.y),
					o = this._grid,
					a = o[s] = o[s] || {},
					l = a[r] = a[r] || [];
				for (delete this._objectPoint[L.Util.stamp(t)], i = 0, n = l.length; n > i; i++)
					if (l[i] === t) return l.splice(i, 1), 1 === n && delete a[r], !0
			},
			eachObject: function (t, e) {
				var i, n, r, s, o, a, l, _ = this._grid;
				for (i in _) {
					o = _[i];
					for (n in o)
						for (a = o[n], r = 0, s = a.length; s > r; r++) l = t.call(e, a[r]), l && (r--, s--)
				}
			},
			getNearObject: function (t) {
				var e, i, n, r, s, o, a, l, _ = this._getCoord(t.x),
					h = this._getCoord(t.y),
					u = this._objectPoint,
					d = this._sqCellSize,
					p = null;
				for (e = h - 1; h + 1 >= e; e++)
					if (r = this._grid[e])
						for (i = _ - 1; _ + 1 >= i; i++)
							if (s = r[i])
								for (n = 0, o = s.length; o > n; n++) a = s[n], l = this._sqDist(u[L.Util.stamp(a)], t), d > l && (d = l, p = a);
				return p
			},
			_getCoord: function (t) {
				return Math.floor(t / this._cellSize)
			},
			_sqDist: function (t, e) {
				var i = e.x - t.x,
					n = e.y - t.y;
				return i * i + n * n
			}
		},
		function () {
			L.QuickHull = {
				getDistant: function (t, e) {
					var i = e[1].lat - e[0].lat,
						n = e[0].lng - e[1].lng;
					return n * (t.lat - e[0].lat) + i * (t.lng - e[0].lng)
				},
				findMostDistantPointFromBaseLine: function (t, e) {
					var i, n, r, s = 0,
						o = null,
						a = [];
					for (i = e.length - 1; i >= 0; i--) n = e[i], r = this.getDistant(n, t), r > 0 && (a.push(n), r > s && (s = r, o = n));
					return {
						maxPoint: o,
						newPoints: a
					}
				},
				buildConvexHull: function (t, e) {
					var i = [],
						n = this.findMostDistantPointFromBaseLine(t, e);
					return n.maxPoint ? (i = i.concat(this.buildConvexHull([t[0], n.maxPoint], n.newPoints)), i = i.concat(this.buildConvexHull([n.maxPoint, t[1]], n.newPoints))) : [t]
				},
				getConvexHull: function (t) {
					var e, i = !1,
						n = !1,
						r = null,
						s = null;
					for (e = t.length - 1; e >= 0; e--) {
						var o = t[e];
						(i === !1 || o.lat > i) && (r = o, i = o.lat), (n === !1 || n > o.lat) && (s = o, n = o.lat)
					}
					var a = [].concat(this.buildConvexHull([s, r], t), this.buildConvexHull([r, s], t));
					return a
				}
			}
		}(), L.MarkerCluster.include({
			getConvexHull: function () {
				var t, e, i, n = this.getAllChildMarkers(),
					r = [],
					s = [];
				for (i = n.length - 1; i >= 0; i--) e = n[i].getLatLng(), r.push(e);
				for (t = L.QuickHull.getConvexHull(r), i = t.length - 1; i >= 0; i--) s.push(t[i][0]);
				return s
			}
		}), L.MarkerCluster.include({
			_2PI: 2 * Math.PI,
			_circleFootSeparation: 25,
			_circleStartAngle: Math.PI / 6,
			_spiralFootSeparation: 28,
			_spiralLengthStart: 11,
			_spiralLengthFactor: 5,
			_circleSpiralSwitchover: 9,
			spiderfy: function () {
				if (this._group._spiderfied !== this && !this._group._inZoomAnimation) {
					var t, e = this.getAllChildMarkers(),
						i = this._group,
						n = i._map,
						r = n.latLngToLayerPoint(this._latlng);
					this._group._unspiderfy(), this._group._spiderfied = this, e.length >= this._circleSpiralSwitchover ? t = this._generatePointsSpiral(e.length, r) : (r.y += 10, t = this._generatePointsCircle(e.length, r)), this._animationSpiderfy(e, t)
				}
			},
			unspiderfy: function (t) {
				this._group._inZoomAnimation || (this._animationUnspiderfy(t), this._group._spiderfied = null)
			},
			_generatePointsCircle: function (t, e) {
				var i, n, r = this._group.options.spiderfyDistanceMultiplier * this._circleFootSeparation * (2 + t),
					s = r / this._2PI,
					o = this._2PI / t,
					a = [];
				for (a.length = t, i = t - 1; i >= 0; i--) n = this._circleStartAngle + i * o, a[i] = new L.Point(e.x + s * Math.cos(n), e.y + s * Math.sin(n))._round();
				return a
			},
			_generatePointsSpiral: function (t, e) {
				var i, n = this._group.options.spiderfyDistanceMultiplier * this._spiralLengthStart,
					r = this._group.options.spiderfyDistanceMultiplier * this._spiralFootSeparation,
					s = this._group.options.spiderfyDistanceMultiplier * this._spiralLengthFactor,
					o = 0,
					a = [];
				for (a.length = t, i = t - 1; i >= 0; i--) o += r / n + 5e-4 * i, a[i] = new L.Point(e.x + n * Math.cos(o), e.y + n * Math.sin(o))._round(), n += this._2PI * s / o;
				return a
			},
			_noanimationUnspiderfy: function () {
				var t, e, i = this._group,
					n = i._map,
					r = this.getAllChildMarkers();
				for (this.setOpacity(1), e = r.length - 1; e >= 0; e--) t = r[e], L.FeatureGroup.prototype.removeLayer.call(i, t), t._preSpiderfyLatlng && (t.setLatLng(t._preSpiderfyLatlng), delete t._preSpiderfyLatlng), t.setZIndexOffset(0), t._spiderLeg && (n.removeLayer(t._spiderLeg), delete t._spiderLeg)
			}
		}), L.MarkerCluster.include(L.DomUtil.TRANSITION ? {
			SVG_ANIMATION: function () {
				return ("" + document.createElementNS("http://www.w3.org/2000/svg", "animate")).indexOf("SVGAnimate") > -1
			}(),
			_animationSpiderfy: function (t, e) {
				var i, n, r, s, o = this,
					a = this._group,
					l = a._map,
					_ = l.latLngToLayerPoint(this._latlng);
				for (i = t.length - 1; i >= 0; i--) n = t[i], n.setZIndexOffset(1e6), n.setOpacity(0), n._noHas = !0, L.FeatureGroup.prototype.addLayer.call(a, n), delete n._noHas, n._setPos(_);
				a._forceLayout(), a._animationStart();
				var h = L.Path.SVG ? 0 : .3,
					u = L.Path.SVG_NS;
				for (i = t.length - 1; i >= 0; i--)
					if (s = l.layerPointToLatLng(e[i]), n = t[i], n._preSpiderfyLatlng = n._latlng, n.setLatLng(s), n.setOpacity(1), r = new L.Polyline([o._latlng, s], {
							weight: 1.5,
							color: "#222",
							opacity: h
						}), l.addLayer(r), n._spiderLeg = r, L.Path.SVG && this.SVG_ANIMATION) {
						var d = r._path.getTotalLength();
						r._path.setAttribute("stroke-dasharray", d + "," + d);
						var p = document.createElementNS(u, "animate");
						p.setAttribute("attributeName", "stroke-dashoffset"), p.setAttribute("begin", "indefinite"), p.setAttribute("from", d), p.setAttribute("to", 0), p.setAttribute("dur", .25), r._path.appendChild(p), p.beginElement(), p = document.createElementNS(u, "animate"), p.setAttribute("attributeName", "stroke-opacity"), p.setAttribute("attributeName", "stroke-opacity"), p.setAttribute("begin", "indefinite"), p.setAttribute("from", 0), p.setAttribute("to", .5), p.setAttribute("dur", .25), r._path.appendChild(p), p.beginElement()
					}
				if (o.setOpacity(.3), L.Path.SVG)
					for (this._group._forceLayout(), i = t.length - 1; i >= 0; i--) n = t[i]._spiderLeg, n.options.opacity = .5, n._path.setAttribute("stroke-opacity", .5);
				setTimeout(function () {
					a._animationEnd(), a.fire("spiderfied")
				}, 200)
			},
			_animationUnspiderfy: function (t) {
				var e, i, n, r = this._group,
					s = r._map,
					o = t ? s._latLngToNewLayerPoint(this._latlng, t.zoom, t.center) : s.latLngToLayerPoint(this._latlng),
					a = this.getAllChildMarkers(),
					l = L.Path.SVG && this.SVG_ANIMATION;
				for (r._animationStart(), this.setOpacity(1), i = a.length - 1; i >= 0; i--) e = a[i], e._preSpiderfyLatlng && (e.setLatLng(e._preSpiderfyLatlng), delete e._preSpiderfyLatlng, e._setPos(o), e.setOpacity(0), l && (n = e._spiderLeg._path.childNodes[0], n.setAttribute("to", n.getAttribute("from")), n.setAttribute("from", 0), n.beginElement(), n = e._spiderLeg._path.childNodes[1], n.setAttribute("from", .5), n.setAttribute("to", 0), n.setAttribute("stroke-opacity", 0), n.beginElement(), e._spiderLeg._path.setAttribute("stroke-opacity", 0)));
				setTimeout(function () {
					var t = 0;
					for (i = a.length - 1; i >= 0; i--) e = a[i], e._spiderLeg && t++;
					for (i = a.length - 1; i >= 0; i--) e = a[i], e._spiderLeg && (e.setOpacity(1), e.setZIndexOffset(0), t > 1 && L.FeatureGroup.prototype.removeLayer.call(r, e), s.removeLayer(e._spiderLeg), delete e._spiderLeg);
					r._animationEnd()
				}, 200)
			}
		} : {
			_animationSpiderfy: function (t, e) {
				var i, n, r, s, o = this._group,
					a = o._map;
				for (i = t.length - 1; i >= 0; i--) s = a.layerPointToLatLng(e[i]), n = t[i], n._preSpiderfyLatlng = n._latlng, n.setLatLng(s), n.setZIndexOffset(1e6), L.FeatureGroup.prototype.addLayer.call(o, n), r = new L.Polyline([this._latlng, s], {
					weight: 1.5,
					color: "#222"
				}), a.addLayer(r), n._spiderLeg = r;
				this.setOpacity(.3), o.fire("spiderfied")
			},
			_animationUnspiderfy: function () {
				this._noanimationUnspiderfy()
			}
		}), L.MarkerClusterGroup.include({
			_spiderfied: null,
			_spiderfierOnAdd: function () {
				this._map.on("click", this._unspiderfyWrapper, this), this._map.options.zoomAnimation ? this._map.on("zoomstart", this._unspiderfyZoomStart, this) : this._map.on("zoomend", this._unspiderfyWrapper, this), L.Path.SVG && !L.Browser.touch && this._map._initPathRoot()
			},
			_spiderfierOnRemove: function () {
				this._map.off("click", this._unspiderfyWrapper, this), this._map.off("zoomstart", this._unspiderfyZoomStart, this), this._map.off("zoomanim", this._unspiderfyZoomAnim, this), this._unspiderfy()
			},
			_unspiderfyZoomStart: function () {
				this._map && this._map.on("zoomanim", this._unspiderfyZoomAnim, this)
			},
			_unspiderfyZoomAnim: function (t) {
				L.DomUtil.hasClass(this._map._mapPane, "leaflet-touching") || (this._map.off("zoomanim", this._unspiderfyZoomAnim, this), this._unspiderfy(t))
			},
			_unspiderfyWrapper: function () {
				this._unspiderfy()
			},
			_unspiderfy: function (t) {
				this._spiderfied && this._spiderfied.unspiderfy(t)
			},
			_noanimationUnspiderfy: function () {
				this._spiderfied && this._spiderfied._noanimationUnspiderfy()
			},
			_unspiderfyLayer: function (t) {
				t._spiderLeg && (L.FeatureGroup.prototype.removeLayer.call(this, t), t.setOpacity(1), t.setZIndexOffset(0), this._map.removeLayer(t._spiderLeg), delete t._spiderLeg)
			}
		})
})(this);